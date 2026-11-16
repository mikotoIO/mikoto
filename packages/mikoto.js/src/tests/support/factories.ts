/**
 * Builders for schema-valid API payloads. Every field can be overridden;
 * ids are fresh UUIDs.
 */
import type {
  Channel,
  MemberExt,
  MessageExt,
  RelationshipExt,
  Role,
  SpaceExt,
  UserExt,
} from '../../api.gen';

export const uuid = () => crypto.randomUUID();

export function user(overrides: Partial<UserExt> = {}): UserExt {
  const id = overrides.id ?? uuid();
  return { id, name: `user-${id.slice(0, 6)}`, handle: null, ...overrides };
}

export function channel(
  spaceId: string | null,
  overrides: Partial<Channel> = {},
): Channel {
  return {
    id: uuid(),
    spaceId,
    name: 'general',
    order: 0,
    type: 'TEXT',
    lastUpdated: null,
    ...overrides,
  };
}

export function role(spaceId: string, overrides: Partial<Role> = {}): Role {
  return {
    id: uuid(),
    spaceId,
    name: '@everyone',
    permissions: [],
    position: -1,
    color: null,
    ...overrides,
  };
}

/** A space with one channel and the @everyone role, like the server makes. */
export function space(overrides: Partial<SpaceExt> = {}): SpaceExt {
  const id = overrides.id ?? uuid();
  return {
    id,
    name: `space-${id.slice(0, 6)}`,
    type: 'NONE',
    ownerId: null,
    memberCount: 1,
    channels: [channel(id)],
    roles: [role(id)],
    ...overrides,
  };
}

export function member(
  spaceId: string,
  u: UserExt = user(),
  overrides: Partial<MemberExt> = {},
): MemberExt {
  return {
    id: uuid(),
    spaceId,
    userId: u.id,
    user: u,
    roleIds: [],
    name: null,
    ...overrides,
  };
}

export function message(
  channelId: string,
  author: UserExt = user(),
  overrides: Partial<MessageExt> = {},
): MessageExt {
  return {
    id: uuid(),
    channelId,
    authorId: author.id,
    author,
    content: 'hello',
    timestamp: new Date().toISOString(),
    editedTimestamp: null,
    attachments: [],
    ...overrides,
  };
}

export function relationship(
  userId: string,
  other: UserExt = user(),
  overrides: Partial<RelationshipExt> = {},
): RelationshipExt {
  return {
    id: uuid(),
    userId,
    relationId: other.id,
    user: other,
    state: 'FRIEND',
    channelId: null,
    ...overrides,
  };
}
