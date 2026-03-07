import { createApiClient, type Api } from '../api.gen';

/**
 * Options for creating the E2E test harness.
 */
export interface TestHarnessOptions {
  /** Base URL of the superego API server (e.g. "http://localhost:3511") */
  apiUrl: string;
}

/**
 * Options for creating a test user. All fields are optional and will be
 * generated with unique defaults if omitted.
 */
export interface CreateUserOptions {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Options for creating a test space. All fields are optional.
 */
export interface CreateSpaceOptions {
  name?: string;
}

/**
 * Options for creating a test channel inside a space.
 */
export interface CreateChannelOptions {
  name?: string;
  type?: 'TEXT' | 'VOICE' | 'DOCUMENT' | 'CATEGORY';
}

let counter = 0;

function uniqueId(): string {
  return `${Date.now()}_${++counter}`;
}

/**
 * An authenticated test user that can perform API operations.
 */
export class TestUser {
  readonly name: string;
  readonly email: string;
  readonly rest: Api;

  private accessToken: string;

  constructor(
    name: string,
    email: string,
    accessToken: string,
    _refreshToken: string,
    apiUrl: string,
  ) {
    this.name = name;
    this.email = email;
    this.accessToken = accessToken;
    this.rest = createApiClient(apiUrl, {});

    // Attach auth token to all requests
    this.rest.use({
      request: async (_, config) => {
        (config.headers as Record<string, string>).Authorization =
          `Bearer ${this.accessToken}`;
        return config;
      },
    });
  }

  /** Create a new space owned by this user. */
  async createSpace(options: CreateSpaceOptions = {}) {
    const name = options.name ?? `test-space-${uniqueId()}`;
    return this.rest['spaces.create']({ name });
  }

  /** Create a channel in a space. */
  async createChannel(spaceId: string, options: CreateChannelOptions = {}) {
    const name = options.name ?? `test-channel-${uniqueId()}`;
    return this.rest['channels.create'](
      { name, type: options.type ?? null },
      { params: { spaceId } },
    );
  }

  /** Send a message to a channel. */
  async sendMessage(spaceId: string, channelId: string, content: string) {
    return this.rest['messages.create'](
      { content },
      { params: { spaceId, channelId } },
    );
  }

  /** List messages in a channel. */
  async listMessages(
    spaceId: string,
    channelId: string,
    limit?: number,
    cursor?: string | null,
  ) {
    return this.rest['messages.list']({
      params: { spaceId, channelId },
      queries: { limit: limit ?? null, cursor: cursor ?? null },
    });
  }

  /** Get the current user's profile. */
  async me() {
    return this.rest['user.get']();
  }

  /** List all spaces the user is a member of. */
  async listSpaces() {
    return this.rest['spaces.list']();
  }

  /** Join a space via invite code. */
  async joinSpace(invite: string) {
    return this.rest['spaces.join'](undefined, { params: { invite } });
  }

  /** Create an invite for a space. */
  async createInvite(spaceId: string) {
    return this.rest['invites.create']({}, { params: { spaceId } });
  }

  /** List members of a space. */
  async listMembers(spaceId: string) {
    return this.rest['members.list']({ params: { spaceId } });
  }

  /** Delete a space. */
  async deleteSpace(spaceId: string) {
    return this.rest['spaces.delete'](undefined, { params: { spaceId } });
  }

  /** Delete a channel. */
  async deleteChannel(spaceId: string, channelId: string) {
    return this.rest['channels.delete'](undefined, {
      params: { spaceId, channelId },
    });
  }
}

/**
 * E2E test harness for Mikoto. Provides utilities to quickly spin up
 * test users, spaces, and channels with sensible defaults.
 *
 * @example
 * ```ts
 * const harness = new TestHarness({ apiUrl: 'http://localhost:3511' });
 *
 * const alice = await harness.createUser({ name: 'Alice' });
 * const space = await alice.createSpace({ name: 'Test Space' });
 * const channel = await alice.createChannel(space.id);
 * await alice.sendMessage(space.id, channel.id, 'Hello!');
 *
 * const snapshot = await harness.takeSnapshot(alice, space.id);
 * ```
 */
export class TestHarness {
  readonly apiUrl: string;
  private createdUsers: TestUser[] = [];
  private createdSpaceIds: string[] = [];

  constructor(options: TestHarnessOptions) {
    this.apiUrl = options.apiUrl;
  }

  /**
   * Register and authenticate a new test user.
   * Returns a TestUser that can make authenticated API calls.
   */
  async createUser(options: CreateUserOptions = {}): Promise<TestUser> {
    const id = uniqueId();
    const name = options.name ?? `test-user-${id}`;
    const email = options.email ?? `test-${id}@e2e.test`;
    const password = options.password ?? `TestPassword123!`;

    const api = createApiClient(this.apiUrl, {});

    const tokens = await api['account.register']({
      name,
      email,
      password,
    });

    const user = new TestUser(
      name,
      email,
      tokens.accessToken,
      tokens.refreshToken ?? '',
      this.apiUrl,
    );

    this.createdUsers.push(user);
    return user;
  }

  /**
   * Convenience: create a user and a space in one call.
   * Returns { user, space } for quick test setup.
   */
  async createUserWithSpace(
    userOptions: CreateUserOptions = {},
    spaceOptions: CreateSpaceOptions = {},
  ) {
    const user = await this.createUser(userOptions);
    const space = await user.createSpace(spaceOptions);
    this.createdSpaceIds.push(space.id);
    return { user, space };
  }

  /**
   * Take a snapshot of a space's current state, including its channels,
   * members, and optionally recent messages from each text channel.
   */
  async takeSnapshot(
    user: TestUser,
    spaceId: string,
    options: { includeMessages?: boolean; messageLimit?: number } = {},
  ): Promise<SpaceSnapshot> {
    const { includeMessages = true, messageLimit = 50 } = options;

    const space = await user.rest['spaces.get']({
      params: { spaceId },
    });

    const members = await user.listMembers(spaceId);

    const channelSnapshots: ChannelSnapshot[] = [];

    for (const channel of space.channels) {
      const channelSnapshot: ChannelSnapshot = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        order: channel.order,
        parentId: channel.parentId ?? null,
      };

      if (includeMessages && channel.type === 'TEXT') {
        const messages = await user.listMessages(
          spaceId,
          channel.id,
          messageLimit,
        );
        channelSnapshot.messages = messages.map((m) => ({
          id: m.id,
          content: m.content,
          authorId: m.authorId ?? null,
          authorName: m.author?.name ?? null,
          timestamp: m.timestamp,
        }));
      }

      channelSnapshots.push(channelSnapshot);
    }

    return {
      id: space.id,
      name: space.name,
      type: space.type,
      ownerId: space.ownerId ?? null,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        roleIds: m.roleIds,
      })),
      channels: channelSnapshots,
      roles: space.roles.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? null,
        permissions: r.permissions,
        position: r.position,
      })),
      takenAt: new Date().toISOString(),
    };
  }

  /**
   * Compare two snapshots and return the differences.
   * Useful for asserting that specific operations caused expected changes.
   */
  static diffSnapshots(before: SpaceSnapshot, after: SpaceSnapshot): SnapshotDiff {
    const diff: SnapshotDiff = {
      spaceChanged: before.name !== after.name || before.type !== after.type,
      addedChannels: after.channels.filter(
        (c) => !before.channels.some((bc) => bc.id === c.id),
      ),
      removedChannels: before.channels.filter(
        (c) => !after.channels.some((ac) => ac.id === c.id),
      ),
      addedMembers: after.members.filter(
        (m) => !before.members.some((bm) => bm.userId === m.userId),
      ),
      removedMembers: before.members.filter(
        (m) => !after.members.some((am) => am.userId === m.userId),
      ),
      addedRoles: after.roles.filter(
        (r) => !before.roles.some((br) => br.id === r.id),
      ),
      removedRoles: before.roles.filter(
        (r) => !after.roles.some((ar) => ar.id === r.id),
      ),
    };

    return diff;
  }

  /**
   * Cleanup all resources created during the test.
   * Call this in your test's afterAll/afterEach hook.
   */
  async cleanup() {
    // Delete spaces first (cascades to channels, messages, etc.)
    for (const user of this.createdUsers) {
      try {
        const spaces = await user.listSpaces();
        for (const space of spaces) {
          if (space.ownerId) {
            try {
              await user.deleteSpace(space.id);
            } catch {
              // Space may already be deleted or user may not own it
            }
          }
        }
      } catch {
        // User may already be in a bad state
      }
    }
    this.createdUsers = [];
    this.createdSpaceIds = [];
  }
}

// ─── Snapshot Types ──────────────────────────────────────────────────────────

export interface MessageSnapshot {
  id: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
  timestamp: string;
}

export interface ChannelSnapshot {
  id: string;
  name: string;
  type: string;
  order: number;
  parentId: string | null;
  messages?: MessageSnapshot[];
}

export interface MemberSnapshot {
  id: string;
  userId: string;
  userName: string;
  roleIds: string[];
}

export interface RoleSnapshot {
  id: string;
  name: string;
  color: string | null;
  permissions: string;
  position: number;
}

export interface SpaceSnapshot {
  id: string;
  name: string;
  type: string;
  ownerId: string | null;
  members: MemberSnapshot[];
  channels: ChannelSnapshot[];
  roles: RoleSnapshot[];
  takenAt: string;
}

export interface SnapshotDiff {
  spaceChanged: boolean;
  addedChannels: ChannelSnapshot[];
  removedChannels: ChannelSnapshot[];
  addedMembers: MemberSnapshot[];
  removedMembers: MemberSnapshot[];
  addedRoles: RoleSnapshot[];
  removedRoles: RoleSnapshot[];
}
