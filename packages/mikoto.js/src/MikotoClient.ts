import { pluginToken } from '@zodios/plugins';

import { AuthClient } from './AuthClient';
import {
  type ConnectionListener,
  type ConnectionState,
  WebsocketApi,
} from './WebsocketApi';
import { type Api, createApiClient } from './api.gen';
import { tokenExpiry } from './helpers/token';
import { RelationshipManager, UserManager } from './managers';
import { ChannelManager } from './managers/channel';
import {
  EmojiManager,
  MemberManager,
  RoleManager,
  SpaceManager,
} from './managers/space';

export interface MikotoClientOptions {
  auth: AuthClient;
  url: string;
  /** Open the live connection immediately (default true). */
  autoConnect?: boolean;
}

/** Refresh access tokens this long before they expire. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;
/** Fallback lifetime for tokens whose expiry can't be read. */
const UNKNOWN_TOKEN_TTL_MS = 10 * 60_000;

function websocketUrl(serverUrl: string) {
  const url = new URL(serverUrl);
  url.protocol = url.protocol.replace('http', 'ws');
  const basePath = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${basePath}/ws`;
}

export class MikotoClient {
  public auth: AuthClient;
  public rest: Api;
  /** Live event stream. Subscriptions made here survive reconnects. */
  public ws: WebsocketApi;

  private accessToken?: string;
  private accessTokenExpiresAt = 0;
  private resyncListeners = new Set<() => void>();
  private resyncing?: Promise<void>;

  spaces = new SpaceManager(this);
  channels = new ChannelManager(this);
  user = new UserManager(this);
  relationships = new RelationshipManager(this);

  constructor(options: MikotoClientOptions) {
    this.auth = options.auth;
    this.rest = createApiClient(options.url, {});
    this.rest.use(
      pluginToken({
        getToken: () => this.getAccessToken(),
        // On a 401, refresh once and retry the request with the new token.
        renewToken: () => this.getAccessToken({ forceRefresh: true }),
      }),
    );

    this.ws = new WebsocketApi({
      url: websocketUrl(options.url),
      getToken: () => this.getAccessToken(),
    });

    SpaceManager._subscribe(this);
    ChannelManager._subscribe(this);
    MemberManager._subscribe(this);
    RoleManager._subscribe(this);
    EmojiManager._subscribe(this);
    RelationshipManager._subscribe(this);

    this.ws.onStateChange((state, previous) => {
      if (state.status !== 'connected') return;
      if (previous.hasConnected) {
        // Events were missed while disconnected; catch up.
        void this.resync();
      } else {
        this.relationships.list().catch(() => {});
      }
    });

    if (options.autoConnect !== false) this.connect();
  }

  /**
   * A valid access token, refreshed when it's about to expire (or always,
   * with `forceRefresh`). Concurrent refreshes are deduplicated by AuthClient.
   */
  async getAccessToken({ forceRefresh = false } = {}): Promise<string> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.accessToken &&
      this.accessTokenExpiresAt - now > TOKEN_REFRESH_MARGIN_MS
    ) {
      return this.accessToken;
    }
    const token = await this.auth.refresh();
    this.accessToken = token;
    this.accessTokenExpiresAt =
      tokenExpiry(token) ?? now + UNKNOWN_TOKEN_TTL_MS;
    return token;
  }

  /** Current state of the live connection. */
  get connection(): ConnectionState {
    return this.ws.state;
  }

  /** Subscribe to connection changes. Returns an unsubscribe function. */
  onConnectionChange(listener: ConnectionListener): () => void {
    return this.ws.onStateChange(listener);
  }

  /**
   * Called after the client has caught up following a reconnect. Use it to
   * refetch anything not covered by the managers (e.g. an open message list).
   */
  onResync(listener: () => void): () => void {
    this.resyncListeners.add(listener);
    return () => this.resyncListeners.delete(listener);
  }

  /**
   * Re-fetch state that live events keep up to date, so changes missed while
   * disconnected (new channels, left spaces, renamed users) are applied.
   */
  resync(): Promise<void> {
    this.resyncing ??= (async () => {
      try {
        await Promise.allSettled([
          this.spaces.sync(),
          this.relationships.sync(),
          this.user.load(),
        ]);
        for (const listener of [...this.resyncListeners]) {
          try {
            listener();
          } catch (error) {
            console.error('[mikoto] resync listener failed', error);
          }
        }
      } finally {
        this.resyncing = undefined;
      }
    })();
    return this.resyncing;
  }

  /** Open (or resume) the live connection. */
  connect() {
    this.ws.connect();
  }

  /** Skip the backoff wait and reconnect right away. */
  reconnectNow() {
    this.ws.reconnectNow();
  }

  /** Close the live connection for good. */
  disconnect() {
    this.ws.close();
  }
}
