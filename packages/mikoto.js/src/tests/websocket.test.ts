import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { WebsocketApi } from '../WebsocketApi';
import { backoffDelay, retry } from '../helpers/retry';
import { tokenExpiry } from '../helpers/token';
import { FakeSocket, flushMicrotasks } from './support/fakeSocket';

const latest = () => FakeSocket.latest();
/** Advance fake time in small steps, running promise callbacks in between. */
async function advance(ms: number) {
  await flushMicrotasks();
  const step = 10;
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(Math.min(step, ms - t));
    await flushMicrotasks();
  }
}
const flush = () => advance(0);

function unauthorized() {
  return new AxiosError('Unauthorized', '401', undefined, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: null,
  });
}

const realWebSocket = globalThis.WebSocket;

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
  Object.assign(globalThis, { WebSocket: FakeSocket });
});

afterEach(() => {
  vi.useRealTimers();
  Object.assign(globalThis, { WebSocket: realWebSocket });
});

async function connectedApi(getToken = vi.fn(async () => 'token-1')) {
  const api = new WebsocketApi({
    url: 'ws://test/ws',
    getToken,
    backoff: { baseMs: 1000, maxMs: 8000 },
  });
  api.connect();
  await flush();
  latest().serverOpen();
  latest().serverSend('ready');
  return { api, getToken };
}

describe('WebsocketApi', () => {
  test('authenticates with the first message and connects on ready', async () => {
    const api = new WebsocketApi({
      url: 'ws://test/ws',
      getToken: async () => 'secret',
    });
    api.connect();
    expect(api.status).toBe('connecting');
    await flush();

    const socket = latest();
    expect(socket.url).toBe('ws://test/ws'); // token is never in the URL
    socket.serverOpen();
    expect(socket.sent[0]).toEqual({
      op: 'authenticate',
      data: { token: 'secret' },
    });
    expect(api.status).toBe('connecting'); // not until the server says ready

    socket.serverSend('ready');
    expect(api.state).toMatchObject({
      status: 'connected',
      hasConnected: true,
    });
  });

  test('emits server events to subscribers', async () => {
    const { api } = await connectedApi();
    const handler = vi.fn();
    api.on('typing.onUpdate', handler);
    latest().serverSend('typing.onUpdate', { channelId: 'c1' });
    expect(handler).toHaveBeenCalledWith({ channelId: 'c1' });
  });

  test('reconnects with backoff and a fresh token, keeping subscriptions', async () => {
    let n = 0;
    const { api, getToken } = await connectedApi(
      vi.fn(async () => `token-${++n}`),
    );
    const handler = vi.fn();
    api.on('typing.onUpdate', handler);
    const changes: string[] = [];
    api.onStateChange((s) => changes.push(s.status));

    latest().serverClose();
    expect(api.state.status).toBe('reconnecting');
    expect(api.state.attempt).toBe(1);
    expect(api.state.nextRetryAt).not.toBeNull();

    await advance(1000); // first delay is at most baseMs
    const second = latest();
    expect(FakeSocket.instances).toHaveLength(2);
    second.serverOpen();
    expect(second.sent[0]).toEqual({
      op: 'authenticate',
      data: { token: 'token-2' },
    });
    second.serverSend('ready');
    expect(api.state).toMatchObject({ status: 'connected', attempt: 0 });
    expect(getToken).toHaveBeenCalledTimes(2);

    second.serverSend('typing.onUpdate', { channelId: 'c2' });
    expect(handler).toHaveBeenCalledWith({ channelId: 'c2' });
    expect(changes).toContain('connected');
  });

  test('backs off further on repeated failures', async () => {
    const { api } = await connectedApi();
    latest().serverClose();
    await advance(1000);
    latest().serverClose(); // second attempt fails before ready
    expect(api.state.attempt).toBe(2);
    const wait = (api.state.nextRetryAt ?? 0) - Date.now();
    expect(wait).toBeGreaterThanOrEqual(1000); // 2s base, half jittered
    expect(wait).toBeLessThanOrEqual(2000);
  });

  test('stops retrying when credentials are rejected', async () => {
    const getToken = vi.fn(async () => 'token');
    const { api } = await connectedApi(getToken);
    getToken.mockRejectedValue(unauthorized());

    latest().serverClose();
    await advance(1000);
    expect(api.status).toBe('unauthorized');
    await advance(60_000);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  test('drops a connection that stops answering pings', async () => {
    const api = new WebsocketApi({
      url: 'ws://test/ws',
      getToken: async () => 't',
      heartbeatIntervalMs: 1000,
      heartbeatTimeoutMs: 500,
    });
    api.connect();
    await flush();
    const socket = latest();
    socket.serverOpen();
    socket.serverSend('ready');

    await advance(1000);
    expect(socket.sent.some((m) => m.op === 'ping')).toBe(true);
    await advance(500); // no pong
    expect(socket.closedWith).toBe(4000);
    expect(api.status).toBe('reconnecting');
  });

  test('keeps a connection that answers pings', async () => {
    const api = new WebsocketApi({
      url: 'ws://test/ws',
      getToken: async () => 't',
      heartbeatIntervalMs: 1000,
      heartbeatTimeoutMs: 500,
    });
    api.connect();
    await flush();
    const socket = latest();
    socket.serverOpen();
    socket.serverSend('ready');

    await advance(1000);
    socket.serverSend('pong', { message: 'x' });
    await advance(500);
    expect(api.status).toBe('connected');
  });

  test('gives up on a socket that never becomes ready', async () => {
    const api = new WebsocketApi({
      url: 'ws://test/ws',
      getToken: async () => 't',
      readyTimeoutMs: 2000,
    });
    api.connect();
    await flush();
    latest().serverOpen();
    await advance(2000);
    expect(latest().closedWith).toBe(4000);
    expect(api.status).toBe('connecting'); // never connected, still trying
    expect(api.state.attempt).toBe(1);
  });

  test('ignores events from an abandoned socket', async () => {
    const { api } = await connectedApi();
    const old = latest();
    const handler = vi.fn();
    api.on('typing.onUpdate', handler);

    old.serverClose();
    api.reconnectNow();
    await flush();
    old.serverSend('typing.onUpdate', { channelId: 'stale' });
    expect(handler).not.toHaveBeenCalled();
  });

  test('drops commands while disconnected instead of throwing', async () => {
    const { api } = await connectedApi();
    expect(api.send('typing.start', { channelId: 'c' })).toBe(true);
    latest().serverClose();
    expect(api.send('typing.start', { channelId: 'c' })).toBe(false);
  });

  test('close() is final until connect() is called again', async () => {
    const { api } = await connectedApi();
    api.close();
    expect(api.status).toBe('closed');
    await advance(60_000);
    expect(FakeSocket.instances).toHaveLength(1);

    api.connect();
    await flush();
    expect(FakeSocket.instances).toHaveLength(2);
  });

  test('ignores malformed messages', async () => {
    const { api } = await connectedApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    latest().onmessage?.({ data: '{not json' });
    expect(api.status).toBe('connected');
    warn.mockRestore();
  });
});

describe('retry helpers', () => {
  test('backoff grows and is capped', () => {
    for (let i = 0; i < 20; i++) {
      const d = backoffDelay(i, { baseMs: 100, maxMs: 1000 });
      const cap = Math.min(1000, 100 * 2 ** i);
      expect(d).toBeGreaterThanOrEqual(cap / 2);
      expect(d).toBeLessThanOrEqual(cap);
    }
  });

  test('retry stops on non-transient errors', async () => {
    const fn = vi.fn(async () => {
      throw unauthorized();
    });
    await expect(retry(fn)).rejects.toThrow('Unauthorized');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retry retries transient errors until success', async () => {
    let calls = 0;
    const promise = retry(
      async () => {
        if (++calls < 3) throw new AxiosError('Network Error');
        return 'ok';
      },
      { baseMs: 10 },
    );
    await advance(100);
    await expect(promise).resolves.toBe('ok');
    expect(calls).toBe(3);
  });

  test('reads JWT expiry', () => {
    const payload = btoa(JSON.stringify({ exp: 1_700_000_000 }));
    expect(tokenExpiry(`x.${payload}.y`)).toBe(1_700_000_000_000);
    expect(tokenExpiry('not-a-jwt')).toBeNull();
  });
});
