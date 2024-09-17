// GENERATED
import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const IndexResponse = z.object({ name: z.string(), version: z.string() });
export type IndexResponse = z.infer<typeof IndexResponse>;

const RegisterPayload = z.object({
  captcha: z.union([z.string(), z.null()]).optional(),
  email: z.string(),
  name: z.string(),
  password: z.string(),
});
export type RegisterPayload = z.infer<typeof RegisterPayload>;

const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.union([z.string(), z.null()]).optional(),
});
export type TokenPair = z.infer<typeof TokenPair>;

const LoginPayload = z.object({ email: z.string(), password: z.string() });
export type LoginPayload = z.infer<typeof LoginPayload>;

const RefreshPayload = z.object({ refreshToken: z.string() });
export type RefreshPayload = z.infer<typeof RefreshPayload>;

const ChangePasswordPayload = z.object({
  id: z.string().uuid(),
  newPassword: z.string(),
  oldPassword: z.string(),
});
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayload>;

const ResetPasswordPayload = z.object({
  captcha: z.union([z.string(), z.null()]).optional(),
  email: z.string(),
});
export type ResetPasswordPayload = z.infer<typeof ResetPasswordPayload>;

const ResetPasswordConfirmData = z.object({
  password: z.string(),
  token: z.string(),
});
export type ResetPasswordConfirmData = z.infer<typeof ResetPasswordConfirmData>;

const Bot = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.string().uuid(),
  secret: z.string(),
});
export type Bot = z.infer<typeof Bot>;

const CreateBotPayload = z.object({ name: z.string() });
export type CreateBotPayload = z.infer<typeof CreateBotPayload>;

const UserCategory = z.enum(["BOT", "UNVERIFIED"]);
export type UserCategory = z.infer<typeof UserCategory>;

const User = z.object({
  avatar: z.union([z.string(), z.null()]).optional(),
  category: z.union([UserCategory, z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
});
export type User = z.infer<typeof User>;

const UserPatch = z.object({
  avatar: z.union([z.string(), z.null()]).optional(),
  name: z.string(),
});
export type UserPatch = z.infer<typeof UserPatch>;

const RelationState = z.enum([
  "NONE",
  "FRIEND",
  "BLOCKED",
  "INCOMING_REQUEST",
  "OUTGOING_REQUEST",
]);
export type RelationState = z.infer<typeof RelationState>;

const Relationship = z.object({
  id: z.string().uuid(),
  relationId: z.string().uuid(),
  spaceId: z.union([z.string(), z.null()]).optional(),
  state: RelationState,
  userId: z.string().uuid(),
});
export type Relationship = z.infer<typeof Relationship>;

const ChannelType = z.enum([
  "TEXT",
  "VOICE",
  "DOCUMENT",
  "APPLICATION",
  "THREAD",
  "CATEGORY",
]);
export type ChannelType = z.infer<typeof ChannelType>;

const Channel = z.object({
  id: z.string().uuid(),
  lastUpdated: z.union([z.string(), z.null()]).optional(),
  name: z.string(),
  order: z.number().int(),
  parentId: z.union([z.string(), z.null()]).optional(),
  spaceId: z.string().uuid(),
  type: ChannelType,
});
export type Channel = z.infer<typeof Channel>;

const Role = z.object({
  color: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
  permissions: z.string(),
  position: z.number().int(),
  spaceId: z.string().uuid(),
});
export type Role = z.infer<typeof Role>;

const SpaceType = z.enum(["NONE", "DM", "GROUP"]);
export type SpaceType = z.infer<typeof SpaceType>;

const SpaceExt = z.object({
  channels: z.array(Channel),
  icon: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.union([z.string(), z.null()]).optional(),
  roles: z.array(Role),
  type: SpaceType,
});
export type SpaceExt = z.infer<typeof SpaceExt>;

const SpaceCreatePayload = z.object({ name: z.string() });
export type SpaceCreatePayload = z.infer<typeof SpaceCreatePayload>;

const SpaceUpdatePayload = z
  .object({
    icon: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
  })
  .partial();
export type SpaceUpdatePayload = z.infer<typeof SpaceUpdatePayload>;

const ChannelCreatePayload = z.object({
  name: z.string(),
  parentId: z.union([z.string(), z.null()]).optional(),
  type: z.union([ChannelType, z.null()]).optional(),
});
export type ChannelCreatePayload = z.infer<typeof ChannelCreatePayload>;

const ChannelPatch = z
  .object({ name: z.union([z.string(), z.null()]) })
  .partial();
export type ChannelPatch = z.infer<typeof ChannelPatch>;

const cursor = z.union([z.string(), z.null()]).optional();
export type cursor = z.infer<typeof cursor>;

const limit = z.union([z.number(), z.null()]).optional();
export type limit = z.infer<typeof limit>;

const MessageExt = z.object({
  author: z.union([User, z.null()]).optional(),
  authorId: z.union([z.string(), z.null()]).optional(),
  channelId: z.string().uuid(),
  content: z.string(),
  editedTimestamp: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  timestamp: z.string(),
});
export type MessageExt = z.infer<typeof MessageExt>;

const MessageSendPayload = z.object({ content: z.string() });
export type MessageSendPayload = z.infer<typeof MessageSendPayload>;

const MessageEditPayload = z.object({ content: z.string() });
export type MessageEditPayload = z.infer<typeof MessageEditPayload>;

const Document = z.object({
  channelId: z.string().uuid(),
  content: z.string(),
  id: z.string().uuid(),
});
export type Document = z.infer<typeof Document>;

const DocumentPatch = z
  .object({ content: z.union([z.string(), z.null()]) })
  .partial();
export type DocumentPatch = z.infer<typeof DocumentPatch>;

const MemberExt = z.object({
  id: z.string().uuid(),
  name: z.union([z.string(), z.null()]).optional(),
  roleIds: z.array(z.string().uuid()),
  spaceId: z.string().uuid(),
  user: User,
  userId: z.string().uuid(),
});
export type MemberExt = z.infer<typeof MemberExt>;

const MemberCreatePayload = z.object({ userId: z.string().uuid() });
export type MemberCreatePayload = z.infer<typeof MemberCreatePayload>;

const MemberUpdatePayload = z.object({ roleIds: z.array(z.string().uuid()) });
export type MemberUpdatePayload = z.infer<typeof MemberUpdatePayload>;

const RoleCreatePayload = z.object({ name: z.string() });
export type RoleCreatePayload = z.infer<typeof RoleCreatePayload>;

const RoleUpdatePayload = z.object({ name: z.string() });
export type RoleUpdatePayload = z.infer<typeof RoleUpdatePayload>;

const Invite = z.object({
  createdAt: z.string(),
  creatorId: z.string().uuid(),
  id: z.string(),
  spaceId: z.string().uuid(),
});
export type Invite = z.infer<typeof Invite>;

const InviteCreatePayload = z.object({}).partial();
export type InviteCreatePayload = z.infer<typeof InviteCreatePayload>;

const ListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial();
export type ListQuery = z.infer<typeof ListQuery>;

const MemberKey = z.object({
  spaceId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type MemberKey = z.infer<typeof MemberKey>;

const MessageKey = z.object({
  channelId: z.string().uuid(),
  messageId: z.string().uuid(),
});
export type MessageKey = z.infer<typeof MessageKey>;

const ObjectWithId = z.object({ id: z.string().uuid() });
export type ObjectWithId = z.infer<typeof ObjectWithId>;

const Ping = z.object({ message: z.string() });
export type Ping = z.infer<typeof Ping>;

export const schemas = {
  IndexResponse,
  RegisterPayload,
  TokenPair,
  LoginPayload,
  RefreshPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  ResetPasswordConfirmData,
  Bot,
  CreateBotPayload,
  UserCategory,
  User,
  UserPatch,
  RelationState,
  Relationship,
  ChannelType,
  Channel,
  Role,
  SpaceType,
  SpaceExt,
  SpaceCreatePayload,
  SpaceUpdatePayload,
  ChannelCreatePayload,
  ChannelPatch,
  cursor,
  limit,
  MessageExt,
  MessageSendPayload,
  MessageEditPayload,
  Document,
  DocumentPatch,
  MemberExt,
  MemberCreatePayload,
  MemberUpdatePayload,
  RoleCreatePayload,
  RoleUpdatePayload,
  Invite,
  InviteCreatePayload,
  ListQuery,
  MemberKey,
  MessageKey,
  ObjectWithId,
  Ping,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/",
    alias: "index",
    requestFormat: "json",
    response: IndexResponse,
  },
  {
    method: "post",
    path: "/account/change_password",
    alias: "account.change_password",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChangePasswordPayload,
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/account/login",
    alias: "account.login",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginPayload,
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/account/refresh",
    alias: "account.refresh",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ refreshToken: z.string() }),
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/account/register",
    alias: "account.register",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RegisterPayload,
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/account/reset_password",
    alias: "account.reset_password",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordPayload,
      },
    ],
    response: z.null(),
  },
  {
    method: "post",
    path: "/account/reset_password/submit",
    alias: "account.reset_password.confirm",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordConfirmData,
      },
    ],
    response: z.null(),
  },
  {
    method: "get",
    path: "/bots/",
    alias: "bots.list",
    requestFormat: "json",
    response: z.array(Bot),
  },
  {
    method: "post",
    path: "/bots/",
    alias: "bots.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }),
      },
    ],
    response: Bot,
  },
  {
    method: "get",
    path: "/relations/",
    alias: "relations.list",
    requestFormat: "json",
    response: z.array(Relationship),
  },
  {
    method: "get",
    path: "/relations/:relationId",
    alias: "relations.get",
    requestFormat: "json",
    response: Relationship,
  },
  {
    method: "post",
    path: "/relations/:relationId/dm",
    alias: "relations.openDm",
    requestFormat: "json",
    response: User,
  },
  {
    method: "get",
    path: "/spaces/",
    alias: "spaces.list",
    requestFormat: "json",
    response: z.array(SpaceExt),
  },
  {
    method: "post",
    path: "/spaces/",
    alias: "spaces.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }),
      },
    ],
    response: SpaceExt,
  },
  {
    method: "get",
    path: "/spaces/:spaceId",
    alias: "spaces.get",
    requestFormat: "json",
    response: SpaceExt,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId",
    alias: "spaces.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:spaceId",
    alias: "spaces.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SpaceUpdatePayload,
      },
    ],
    response: SpaceExt,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/",
    alias: "channels.list",
    requestFormat: "json",
    response: z.array(Channel),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/channels/",
    alias: "channels.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChannelCreatePayload,
      },
    ],
    response: Channel,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/:channelId",
    alias: "channels.get",
    requestFormat: "json",
    response: Channel,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/channels/:channelId",
    alias: "channels.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/channels/:channelId",
    alias: "channels.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChannelPatch,
      },
    ],
    response: Channel,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/:channelId/documents/",
    alias: "document.get",
    requestFormat: "json",
    response: Document,
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/channels/:channelId/documents/",
    alias: "document.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DocumentPatch,
      },
    ],
    response: Document,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/:channelId/messages/",
    alias: "messages.list",
    requestFormat: "json",
    parameters: [
      {
        name: "cursor",
        type: "Query",
        schema: cursor,
      },
      {
        name: "limit",
        type: "Query",
        schema: limit,
      },
    ],
    response: z.array(MessageExt),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/channels/:channelId/messages/",
    alias: "messages.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ content: z.string() }),
      },
    ],
    response: MessageExt,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/:channelId/messages/:messageId",
    alias: "messages.get",
    requestFormat: "json",
    response: MessageExt,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/channels/:channelId/messages/:messageId",
    alias: "messages.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/channels/:channelId/messages/:messageId",
    alias: "messages.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ content: z.string() }),
      },
    ],
    response: MessageExt,
  },
  {
    method: "post",
    path: "/spaces/:spaceId/channels/:channelId/voice/",
    alias: "voice.join",
    requestFormat: "json",
    response: Document,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/invites/",
    alias: "invites.list",
    requestFormat: "json",
    response: z.array(Invite),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/invites/",
    alias: "invites.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({}).partial(),
      },
    ],
    response: Invite,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/invites/:inviteId",
    alias: "invites.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/leave",
    alias: "spaces.leave",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "get",
    path: "/spaces/:spaceId/members/",
    alias: "members.list",
    requestFormat: "json",
    response: z.array(MemberExt),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/members/",
    alias: "members.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ userId: z.string().uuid() }),
      },
    ],
    response: MemberExt,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/members/:userId",
    alias: "members.get",
    requestFormat: "json",
    response: MemberExt,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/members/:userId",
    alias: "members.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/members/:userId",
    alias: "members.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MemberUpdatePayload,
      },
    ],
    response: MemberExt,
  },
  {
    method: "post",
    path: "/spaces/:spaceId/roles/",
    alias: "roles.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }),
      },
    ],
    response: Role,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/roles/:roleId",
    alias: "roles.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/roles/:roleId",
    alias: "roles.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }),
      },
    ],
    response: Role,
  },
  {
    method: "post",
    path: "/spaces/join/:invite",
    alias: "spaces.join",
    requestFormat: "json",
    response: SpaceExt,
  },
  {
    method: "get",
    path: "/users/me",
    alias: "user.get",
    requestFormat: "json",
    response: User,
  },
  {
    method: "patch",
    path: "/users/me",
    alias: "user.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UserPatch,
      },
    ],
    response: User,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

export const websocketCommands = {
  ping: Ping,
};

export const websocketEvents = {
  "channels.onCreate": Channel,
  "channels.onDelete": ObjectWithId,
  "channels.onUpdate": Channel,
  "members.onCreate": MemberExt,
  "members.onDelete": MemberKey,
  "members.onUpdate": MemberExt,
  "messages.onCreate": MessageExt,
  "messages.onDelete": MessageKey,
  "messages.onUpdate": MessageExt,
  pong: Ping,
  "roles.onCreate": Role,
  "roles.onDelete": Role,
  "roles.onUpdate": Role,
  "spaces.onCreate": SpaceExt,
  "spaces.onDelete": ObjectWithId,
  "spaces.onUpdate": SpaceExt,
  "users.onCreate": User,
  "users.onDelete": ObjectWithId,
  "users.onUpdate": User,
};
