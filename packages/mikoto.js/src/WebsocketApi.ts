import EventEmitter from 'events';
import type { z } from 'zod';

import type { WebsocketEventEmitter, websocketCommands } from './api.gen';
import {
  type BackoffOptions,
  backoffDelay,
  isAuthError,
} from './helpers/retry';

/**
 * - idle: not started yet.
 * - connecting: first connection (or retrying one that never succeeded).
 * - connected: authenticated and receiving events.
 * - reconnecting: lost an established connection; waiting to retry or retrying.
 * - offline: the browser reports no network; waits for it to come back.
 * - unauthorized: credentials were rejected; won't retry until `connect()`.
 * - closed: closed on purpose via `close()`.
 */
export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'unauthorized'
  | 'closed';

export interface ConnectionState {
  status: ConnectionStatus;
  /** Consecutive failed attempts since the last successful connection. */
  attempt: number;
  /** When the next automatic attempt happens (ms since epoch), if scheduled. */
  nextRetryAt: number | null;
  /** True once a connection has succeeded at least once. */
  hasConnected: boolean;
}

export type ConnectionListener = (
  state: ConnectionState,
  previous: ConnectionState,
) => void;

export interface WebsocketApiOptions {
  url: string;
  /** Called before every connection attempt, so each one uses a fresh token. */
  getToken: () => Promise<string | undefined>;
  /** Treat errors from `getToken` as "signed out" (default: HTTP 401/403). */
  isAuthError?: (error: unknown) => boolean;
  /** How often to ping an idle connection. */
  heartbeatIntervalMs?: number;
  /** How long to wait for a pong before declaring the connection dead. */
  heartbeatTimeoutMs?: number;
  /** How long to wait for the server's `ready` after the socket opens. */
  readyTimeoutMs?: number;
  backoff?: BackoffOptions;
}

type WebsocketCommands = typeof websocketCommands;

const INITIAL_STATE: ConnectionState = {
  status: 'idle',
  attempt: 0,
  nextRetryAt: null,
  hasConnected: false,
};

const hasWindow = typeof window !== 'undefined';

/**
 * A single long-lived connection to superego's event stream. It owns the
 * socket lifecycle: authenticate, wait for `ready`, heartbeat, and reconnect
 * with jittered exponential backoff. Event subscriptions (`on(...)`) are
 * made once on this object and survive reconnects.
 */
export class WebsocketApi extends (EventEmitter as unknown as new () => WebsocketEventEmitter) {
  private socket: WebSocket | null = null;
  private current: ConnectionState = INITIAL_STATE;
  private stateListeners = new Set<ConnectionListener>();
  /** Bumped whenever a socket is abandoned, so its late events are ignored. */
  private generation = 0;
  private wantOpen = false;

  private retryTimer?: ReturnType<typeof setTimeout>;
  private readyTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private pongTimer?: ReturnType<typeof setTimeout>;

  private readonly options: Required<Omit<WebsocketApiOptions, 'backoff'>> &
    Pick<WebsocketApiOptions, 'backoff'>;

  constructor(options: WebsocketApiOptions) {
    super();
    // Many surfaces subscribe to the same events; that's expected.
    this.setMaxListeners(0);
    this.options = {
      isAuthError,
      heartbeatIntervalMs: 25_000,
      heartbeatTimeoutMs: 10_000,
      readyTimeoutMs: 15_000,
      ...options,
    };
  }

  /** The current connection state (a new object on every change). */
  get state(): ConnectionState {
    return this.current;
  }

  get status(): ConnectionStatus {
    return this.current.status;
  }

  /** The underlying socket, if one is open. Prefer `state` and `send`. */
  get ws(): WebSocket | null {
    return this.socket;
  }

  /** Subscribe to connection state changes. Returns an unsubscribe function. */
  onStateChange(listener: ConnectionListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Start (or resume) connecting. Safe to call repeatedly. */
  connect() {
    if (!this.wantOpen) {
      this.wantOpen = true;
      this.addWindowListeners();
    }
    const { status } = this.current;
    if (status === 'connected') return;
    if (
      (status === 'connecting' || status === 'reconnecting') &&
      !this.retryTimer
    )
      return; // an attempt is already in flight
    this.clearRetry();
    void this.open();
  }

  /** Skip the backoff wait and try right away. */
  reconnectNow() {
    if (!this.wantOpen || this.current.status === 'connected') return;
    this.clearRetry();
    void this.open();
  }

  /** Close for good. Call `connect()` to start again. */
  close() {
    this.wantOpen = false;
    this.removeWindowListeners();
    this.clearRetry();
    this.abandonSocket(1000, 'client closed');
    this.setState({ status: 'closed', nextRetryAt: null });
  }

  /**
   * Send a command if connected. Commands are ephemeral (pings, typing), so
   * they're dropped rather than queued while disconnected. Returns whether
   * the command was sent.
   */
  send<K extends keyof WebsocketCommands>(
    op: K,
    data: z.infer<WebsocketCommands[K]>,
  ): boolean {
    const socket = this.socket;
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      this.current.status !== 'connected'
    ) {
      return false;
    }
    socket.send(JSON.stringify({ op, data }));
    return true;
  }

  /* ------------------------------------------------------------ internals */

  private setState(patch: Partial<ConnectionState>) {
    const previous = this.current;
    const next = { ...previous, ...patch };
    if (
      next.status === previous.status &&
      next.attempt === previous.attempt &&
      next.nextRetryAt === previous.nextRetryAt &&
      next.hasConnected === previous.hasConnected
    ) {
      return;
    }
    this.current = next;
    for (const listener of [...this.stateListeners]) {
      try {
        listener(next, previous);
      } catch (error) {
        console.error('[mikoto] connection listener failed', error);
      }
    }
  }

  private async open() {
    const generation = ++this.generation;
    this.abandonSocket(1000, 'reconnecting');
    this.setState({
      status: this.current.hasConnected ? 'reconnecting' : 'connecting',
      nextRetryAt: null,
    });

    let token: string | undefined;
    try {
      token = await this.options.getToken();
    } catch (error) {
      if (generation !== this.generation || !this.wantOpen) return;
      if (this.options.isAuthError(error)) {
        this.setState({ status: 'unauthorized', nextRetryAt: null });
        return;
      }
      this.scheduleRetry();
      return;
    }
    if (generation !== this.generation || !this.wantOpen) return;

    let socket: WebSocket;
    try {
      socket = new WebSocket(this.options.url);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      if (generation !== this.generation) return;
      // Token goes in the first message, never in the URL.
      if (token) {
        socket.send(JSON.stringify({ op: 'authenticate', data: { token } }));
      }
      this.readyTimer = setTimeout(
        () => this.dropSocket('ready timeout'),
        this.options.readyTimeoutMs,
      );
    };

    socket.onmessage = (event) => {
      if (generation !== this.generation) return;
      const message = parseMessage(event.data);
      if (!message) return;

      if (message.op === 'ready') {
        clearTimeout(this.readyTimer);
        this.setState({
          status: 'connected',
          attempt: 0,
          nextRetryAt: null,
          hasConnected: true,
        });
        this.startHeartbeat();
        return;
      }
      if (message.op === 'pong') clearTimeout(this.pongTimer);

      // Ops come from the server's typed event table; emit as-is.
      (this.emit as (op: string, data: unknown) => boolean)(
        message.op,
        message.data,
      );
    };

    socket.onclose = () => {
      if (generation !== this.generation) return;
      this.socket = null;
      this.stopTimers();
      if (!this.wantOpen) {
        this.setState({ status: 'closed', nextRetryAt: null });
        return;
      }
      this.scheduleRetry();
    };

    // An error is always followed by close; handle it there.
    socket.onerror = () => {};
  }

  /** Give up on the current socket immediately and schedule a retry. */
  private dropSocket(reason: string) {
    if (!this.socket) return;
    this.generation++;
    this.abandonSocket(4000, reason);
    if (this.wantOpen) this.scheduleRetry();
  }

  private abandonSocket(code: number, reason: string) {
    this.stopTimers();
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
    try {
      socket.close(code, reason);
    } catch {
      // already closing
    }
  }

  private scheduleRetry() {
    if (!this.wantOpen) return;
    this.clearRetry();
    const status = this.current.hasConnected ? 'reconnecting' : 'connecting';

    if (hasWindow && navigator.onLine === false) {
      // Retrying while offline only burns battery; the `online` event resumes.
      this.setState({ status: 'offline', nextRetryAt: null });
      return;
    }

    const delay = backoffDelay(this.current.attempt, this.options.backoff);
    this.setState({
      status,
      attempt: this.current.attempt + 1,
      nextRetryAt: Date.now() + delay,
    });
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.open();
    }, delay);
  }

  private clearRetry() {
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  private startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(
      () => this.ping(),
      this.options.heartbeatIntervalMs,
    );
  }

  /** Ask the server for a pong; drop the socket if none arrives in time. */
  private ping() {
    if (this.pongTimer !== undefined) clearTimeout(this.pongTimer);
    const sent = this.send('ping', { message: String(Date.now()) });
    if (!sent) return;
    this.pongTimer = setTimeout(
      () => this.dropSocket('heartbeat timeout'),
      this.options.heartbeatTimeoutMs,
    );
  }

  private stopTimers() {
    clearTimeout(this.readyTimer);
    clearTimeout(this.pongTimer);
    clearInterval(this.heartbeatTimer);
    this.pongTimer = undefined;
  }

  /* --------------------------------------------- browser network signals */

  private onOnline = () => {
    if (this.current.status !== 'connected') this.reconnectNow();
  };

  private onOffline = () => {
    if (this.current.status === 'connected') {
      // The socket may linger half-open; verify it right away.
      this.ping();
    } else {
      this.clearRetry();
      this.setState({ status: 'offline', nextRetryAt: null });
    }
  };

  private onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    // After sleep or a long background stretch, check rather than wait out
    // the heartbeat or a long backoff.
    if (this.current.status === 'connected') this.ping();
    else if (this.current.status === 'reconnecting') this.reconnectNow();
  };

  private addWindowListeners() {
    if (!hasWindow) return;
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.addEventListener('visibilitychange', this.onVisible);
  }

  private removeWindowListeners() {
    if (!hasWindow) return;
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    document.removeEventListener('visibilitychange', this.onVisible);
  }
}

function parseMessage(raw: unknown): { op: string; data: unknown } | null {
  if (typeof raw !== 'string') return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'op' in value &&
      typeof value.op === 'string'
    ) {
      return { op: value.op, data: 'data' in value ? value.data : undefined };
    }
  } catch {
    console.warn('[mikoto] ignored a malformed websocket message');
  }
  return null;
}
