/**
 * An in-memory superego for testing MikotoClient end to end: REST requests
 * are answered by route handlers (through an axios adapter), and the live
 * connection is a FakeSocket the test pushes events into.
 */
import axios, {
  type AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { vi } from 'vitest';

import type { AuthClient } from '../../AuthClient';
import { MikotoClient } from '../../MikotoClient';
import { FakeSocket, flushMicrotasks } from './fakeSocket';

export const BASE_URL = 'http://superego.test';

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

export interface FakeRequest {
  method: Method;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

type Handler = (req: FakeRequest) => unknown | Promise<unknown>;

/** Throw from a handler to answer with an error status. */
export class HttpError {
  constructor(
    public status: number,
    public body: unknown = { message: 'error' },
  ) {}
}

interface Route {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

function compile(path: string) {
  const keys: string[] = [];
  const source = path.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { pattern: new RegExp(`^${source}$`), keys };
}

export class FakeBackend {
  private routes: Route[] = [];
  /** Every request the client made, in order. */
  requests: FakeRequest[] = [];
  /** The access token handed to the client; change to simulate rotation. */
  token = 'token-1';

  constructor() {
    // Things MikotoClient fetches on its own; tests override as needed.
    this.on('get', '/spaces/:spaceId/members', () => []);
    this.on('get', '/relations', () => []);
  }

  /** Register a handler. Later registrations win. */
  on(method: Method, path: string, handler: Handler) {
    this.routes.unshift({ method, ...compile(path), handler });
    return this;
  }

  /** Requests matching a method and path (e.g. '/spaces/:spaceId'). */
  calls(method: Method, path: string) {
    const { pattern } = compile(path);
    return this.requests.filter(
      (r) => r.method === method && pattern.test(r.path),
    );
  }

  adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const url = new URL(config.url ?? '', config.baseURL ?? BASE_URL);
    const method = (config.method ?? 'get').toLowerCase() as Method;
    // superego trims trailing slashes (the generated client sends some)
    const path = url.pathname.replace(/(.)\/+$/, '$1');
    for (const [k, v] of Object.entries(config.params ?? {})) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(config.headers ?? {})) {
      if (typeof v === 'string') headers[k.toLowerCase()] = v;
    }
    const route = this.routes.find(
      (r) => r.method === method && r.pattern.test(path),
    );
    const params: Record<string, string> = {};
    if (route) {
      const match = route.pattern.exec(path)!;
      route.keys.forEach(
        (k, i) => (params[k] = decodeURIComponent(match[i + 1])),
      );
    }
    const req: FakeRequest = {
      method,
      path,
      params,
      query: url.searchParams,
      body:
        typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      headers,
    };
    this.requests.push(req);

    const respond = (status: number, data: unknown) => {
      const response = {
        status,
        statusText: String(status),
        headers: {},
        config,
        data,
      };
      if (status >= 400) {
        throw new AxiosError(
          `Request failed with status code ${status}`,
          String(status),
          config,
          null,
          { ...response, config: { ...config, headers: new AxiosHeaders() } },
        );
      }
      return response;
    };

    if (!route)
      return respond(404, { message: `no route for ${method} ${path}` });
    try {
      return respond(200, (await route.handler(req)) ?? null);
    } catch (e) {
      if (e instanceof HttpError) return respond(e.status, e.body);
      throw e;
    }
  };

  /** The socket the client is currently connected through. */
  get socket() {
    return FakeSocket.latest();
  }

  /** Push a server event to the client and let handlers run. */
  async emit(op: string, data: unknown) {
    this.socket.serverSend(op, data);
    await settle();
  }
}

/** Let promise callbacks and zero-delay timers run. */
export async function settle() {
  await flushMicrotasks();
  await new Promise((r) => setTimeout(r, 0));
  await flushMicrotasks();
}

const realWebSocket = globalThis.WebSocket;
const realAdapter = axios.defaults.adapter;

/** Install fakes for the duration of a test. Call `restore` afterwards. */
export function installFakes() {
  const backend = new FakeBackend();
  FakeSocket.instances = [];
  Object.assign(globalThis, { WebSocket: FakeSocket });
  axios.defaults.adapter = backend.adapter;
  return backend;
}

export function restoreFakes() {
  Object.assign(globalThis, { WebSocket: realWebSocket });
  axios.defaults.adapter = realAdapter;
  vi.restoreAllMocks();
}

/**
 * A MikotoClient talking to `backend`, with its live connection open and
 * ready.
 */
export async function connectClient(backend: FakeBackend) {
  const auth = { refresh: vi.fn(async () => backend.token) };
  const client = new MikotoClient({
    auth: auth as unknown as AuthClient,
    url: BASE_URL,
  });
  await settle();
  backend.socket.serverOpen();
  await settle();
  backend.socket.serverSend('ready');
  await settle();
  return { client, auth };
}
