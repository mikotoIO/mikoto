/**
 * Helpers for rendering components against a real MikotoClient whose REST
 * calls are answered in memory. The live connection stays closed; push
 * state in through the managers instead.
 */
import {
  type AuthClient,
  type MemberExt,
  MikotoClient,
  MikotoSpace,
  type SpaceExt,
  type UserExt,
} from '@mikoto-io/mikoto.js';
import { type RenderOptions, render } from '@testing-library/react';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import type { ReactElement, ReactNode } from 'react';

import { MikotoContext } from '@/hooks';

export const uuid = () => crypto.randomUUID();

export function makeUser(overrides: Partial<UserExt> = {}): UserExt {
  return { id: uuid(), name: 'user', handle: null, ...overrides };
}

export function makeSpace(overrides: Partial<SpaceExt> = {}): SpaceExt {
  const id = overrides.id ?? uuid();
  return {
    id,
    name: 'Test space',
    type: 'NONE',
    memberCount: 0,
    ownerId: null,
    channels: [
      {
        id: uuid(),
        spaceId: id,
        name: 'general',
        order: 0,
        type: 'TEXT',
        lastUpdated: null,
      },
    ],
    roles: [],
    ...overrides,
  };
}

export function makeMember(
  spaceId: string,
  user: UserExt = makeUser(),
  overrides: Partial<MemberExt> = {},
): MemberExt {
  return {
    id: uuid(),
    spaceId,
    userId: user.id,
    user,
    roleIds: [],
    name: null,
    ...overrides,
  };
}

/**
 * An in-memory backend: members per space, served from
 * `GET /spaces/:id/members` and `GET /spaces/:id/members/:userId`.
 */
export class TestBackend {
  members = new Map<string, MemberExt[]>();
  /** Paths requested, in order. */
  requests: string[] = [];

  adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const path = new URL(config.url ?? '', config.baseURL).pathname.replace(
      /(.)\/+$/,
      '$1',
    );
    this.requests.push(path);
    const respond = (status: number, data: unknown) => {
      if (status >= 400) {
        throw Object.assign(new Error(`HTTP ${status}`), {
          isAxiosError: true,
          response: { status, data },
        });
      }
      return { status, statusText: 'OK', headers: {}, config, data };
    };

    const one = /^\/spaces\/([^/]+)\/members\/([^/]+)$/.exec(path);
    if (one) {
      const found = this.members.get(one[1])?.find((m) => m.userId === one[2]);
      return found ? respond(200, found) : respond(404, null);
    }
    const all = /^\/spaces\/([^/]+)\/members$/.exec(path);
    if (all) return respond(200, this.members.get(all[1]) ?? []);
    return respond(404, { message: `no route for ${path}` });
  };
}

export function createTestClient(backend = new TestBackend()) {
  const auth = { refresh: async () => 'test-token' };
  const client = new MikotoClient({
    auth: auth as unknown as AuthClient,
    url: 'http://superego.test',
    autoConnect: false,
  });
  client.rest.axios.defaults.adapter = backend.adapter;
  return { client, backend };
}

/** Add a space to the client's cache, as `spaces.list` would. */
export function addSpace(client: MikotoClient, data: SpaceExt) {
  return new MikotoSpace(data, client);
}

export function renderWithClient(
  client: MikotoClient,
  ui: ReactElement,
  options?: RenderOptions,
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MikotoContext value={client}>{children}</MikotoContext>
  );
  return render(ui, { wrapper, ...options });
}
