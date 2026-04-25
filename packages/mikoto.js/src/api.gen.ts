// GENERATED
import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import TypedEventEmitter from "typed-emitter";
import { z } from "zod";

export const IndexResponse = z.object({
  name: z.string(),
  version: z.string(),
});
export type IndexResponse = z.infer<typeof IndexResponse>;

export const RegisterPayload = z.object({
  email: z.string(),
  name: z.string(),
  password: z.string(),
});
export type RegisterPayload = z.infer<typeof RegisterPayload>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.union([z.string(), z.null()]).optional(),
});
export type TokenPair = z.infer<typeof TokenPair>;

export const LoginPayload = z.object({
  email: z.string(),
  password: z.string(),
});
export type LoginPayload = z.infer<typeof LoginPayload>;

export const RefreshPayload = z.object({ refreshToken: z.string() });
export type RefreshPayload = z.infer<typeof RefreshPayload>;

export const ChangePasswordPayload = z.object({
  newPassword: z.string(),
  oldPassword: z.string(),
});
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayload>;

export const ResetPasswordPayload = z.object({ email: z.string() });
export type ResetPasswordPayload = z.infer<typeof ResetPasswordPayload>;

export const ResetPasswordConfirmData = z.object({
  password: z.string(),
  token: z.string(),
});
export type ResetPasswordConfirmData = z.infer<typeof ResetPasswordConfirmData>;

export const UserCategory = z.enum(["BOT", "UNVERIFIED"]);
export type UserCategory = z.infer<typeof UserCategory>;

export const UserExt = z.object({
  avatar: z.union([z.string(), z.null()]).optional(),
  category: z.union([UserCategory, z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  handle: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
});
export type UserExt = z.infer<typeof UserExt>;

export const BotVisibility = z.enum(["PUBLIC", "PRIVATE"]);
export type BotVisibility = z.infer<typeof BotVisibility>;

export const BotInfo = z.object({
  id: z.string().uuid(),
  lastTokenRegeneratedAt: z.union([z.string(), z.null()]).optional(),
  name: z.string(),
  ownerId: z.string().uuid(),
  permissions: z.array(z.string()),
  user: z.union([UserExt, z.null()]).optional(),
  visibility: BotVisibility,
});
export type BotInfo = z.infer<typeof BotInfo>;

export const CreateBotPayload = z.object({ name: z.string() });
export type CreateBotPayload = z.infer<typeof CreateBotPayload>;

export const BotCreatedResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.string().uuid(),
  token: z.string(),
});
export type BotCreatedResponse = z.infer<typeof BotCreatedResponse>;

export const BotLoginPayload = z.object({
  botId: z.string().uuid(),
  token: z.string(),
});
export type BotLoginPayload = z.infer<typeof BotLoginPayload>;

export const UpdateBotPayload = z
  .object({
    avatar: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
    permissions: z.union([z.array(z.string()), z.null()]),
    visibility: z.union([BotVisibility, z.null()]),
  })
  .partial();
export type UpdateBotPayload = z.infer<typeof UpdateBotPayload>;

export const BotSpaceInfo = z.object({
  spaceIcon: z.union([z.string(), z.null()]).optional(),
  spaceId: z.string().uuid(),
  spaceName: z.string(),
});
export type BotSpaceInfo = z.infer<typeof BotSpaceInfo>;

export const InstallBotPayload = z.object({ spaceId: z.string().uuid() });
export type InstallBotPayload = z.infer<typeof InstallBotPayload>;

export const HandleOwner = z.union([
  z.object({ id: z.string().uuid(), type: z.literal("user") }),
  z.object({ id: z.string().uuid(), type: z.literal("space") }),
]);
export type HandleOwner = z.infer<typeof HandleOwner>;

export const HandleResolution = z.object({
  createdAt: z.string(),
  handle: z.string(),
  owner: HandleOwner,
  verifiedAt: z.union([z.string(), z.null()]).optional(),
});
export type HandleResolution = z.infer<typeof HandleResolution>;

export const InstanceInfo = z.object({
  apiEndpoint: z.string(),
  domain: z.string(),
  handleDomain: z.string(),
  publicKey: z.union([z.string(), z.null()]).optional(),
});
export type InstanceInfo = z.infer<typeof InstanceInfo>;

export const UserPatch = z
  .object({
    avatar: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
  })
  .partial();
export type UserPatch = z.infer<typeof UserPatch>;

export const HandlePayload = z.object({ handle: z.string() });
export type HandlePayload = z.infer<typeof HandlePayload>;

export const VerifyHandleRequest = z.object({ handle: z.string() });
export type VerifyHandleRequest = z.infer<typeof VerifyHandleRequest>;

export const VerificationChallenge = z.object({
  createdAt: z.string().datetime({ offset: true }),
  dnsTxtName: z.string(),
  dnsTxtRecord: z.string(),
  entityId: z.string().uuid(),
  entityType: z.string(),
  handle: z.string(),
  nonce: z.string(),
  wellKnownContent: z.string(),
  wellKnownUrl: z.string(),
});
export type VerificationChallenge = z.infer<typeof VerificationChallenge>;

export const VerificationResult = z.object({
  error: z.union([z.string(), z.null()]).optional(),
  method: z.union([z.string(), z.null()]).optional(),
  success: z.boolean(),
});
export type VerificationResult = z.infer<typeof VerificationResult>;

export const RelationState = z.enum([
  "NONE",
  "FRIEND",
  "BLOCKED",
  "INCOMING_REQUEST",
  "OUTGOING_REQUEST",
]);
export type RelationState = z.infer<typeof RelationState>;

export const RelationshipExt = z.object({
  channelId: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  relationId: z.string().uuid(),
  state: RelationState,
  user: UserExt,
  userId: z.string().uuid(),
});
export type RelationshipExt = z.infer<typeof RelationshipExt>;

export const Timestamp = z.string();
export type Timestamp = z.infer<typeof Timestamp>;

export const ChannelType = z.enum([
  "TEXT",
  "VOICE",
  "DOCUMENT",
  "APPLICATION",
  "THREAD",
  "CATEGORY",
]);
export type ChannelType = z.infer<typeof ChannelType>;

export const Channel = z.object({
  id: z.string().uuid(),
  lastUpdated: z.union([Timestamp, z.null()]).optional(),
  name: z.string(),
  order: z.number().int(),
  parentId: z.union([z.string(), z.null()]).optional(),
  spaceId: z.union([z.string(), z.null()]).optional(),
  type: ChannelType,
});
export type Channel = z.infer<typeof Channel>;

export const cursor = z.union([z.string(), z.null()]).optional();
export type cursor = z.infer<typeof cursor>;

export const limit = z.union([z.number(), z.null()]).optional();
export type limit = z.infer<typeof limit>;

export const MessageAttachment = z.object({
  contentType: z.string(),
  filename: z.string(),
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  order: z.number().int(),
  size: z.number().int(),
  url: z.string(),
});
export type MessageAttachment = z.infer<typeof MessageAttachment>;

export const User = z.object({
  avatar: z.union([z.string(), z.null()]).optional(),
  category: z.union([UserCategory, z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
});
export type User = z.infer<typeof User>;

export const MessageExt = z.object({
  attachments: z.array(MessageAttachment),
  author: z.union([User, z.null()]).optional(),
  authorId: z.union([z.string(), z.null()]).optional(),
  channelId: z.string().uuid(),
  content: z.string(),
  editedTimestamp: z.union([Timestamp, z.null()]).optional(),
  id: z.string().uuid(),
  timestamp: Timestamp.datetime({ offset: true }),
});
export type MessageExt = z.infer<typeof MessageExt>;

export const MessageAttachmentInput = z.object({
  contentType: z.string(),
  filename: z.string(),
  size: z.number().int(),
  url: z.string(),
});
export type MessageAttachmentInput = z.infer<typeof MessageAttachmentInput>;

export const MessageSendPayload = z.object({
  attachments: z.array(MessageAttachmentInput).optional().default([]),
  content: z.string(),
});
export type MessageSendPayload = z.infer<typeof MessageSendPayload>;

export const MessageEditPayload = z.object({ content: z.string() });
export type MessageEditPayload = z.infer<typeof MessageEditPayload>;

export const ChannelUnread = z.object({
  channelId: z.string().uuid(),
  timestamp: Timestamp.datetime({ offset: true }),
  userId: z.string().uuid(),
});
export type ChannelUnread = z.infer<typeof ChannelUnread>;

export const PushConfig = z
  .object({ publicKey: z.union([z.string(), z.null()]) })
  .partial();
export type PushConfig = z.infer<typeof PushConfig>;

export const SubscribePayload = z.object({
  auth: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
});
export type SubscribePayload = z.infer<typeof SubscribePayload>;

export const SubscribeResponse = z.object({ id: z.string().uuid() });
export type SubscribeResponse = z.infer<typeof SubscribeResponse>;

export const UnsubscribePayload = z.object({ endpoint: z.string() });
export type UnsubscribePayload = z.infer<typeof UnsubscribePayload>;

export const Role = z.object({
  color: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
  permissions: z.string(),
  position: z.number().int(),
  spaceId: z.string().uuid(),
});
export type Role = z.infer<typeof Role>;

export const SpaceType = z.enum(["NONE", "DM", "GROUP"]);
export type SpaceType = z.infer<typeof SpaceType>;

export const SpaceVisibility = z.enum(["PRIVATE", "PUBLIC"]);
export type SpaceVisibility = z.infer<typeof SpaceVisibility>;

export const SpaceExt = z.object({
  channels: z.array(Channel),
  handle: z.union([z.string(), z.null()]).optional(),
  icon: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  memberCount: z.number().int(),
  name: z.string(),
  ownerId: z.union([z.string(), z.null()]).optional(),
  roles: z.array(Role),
  type: SpaceType,
  visibility: z.union([SpaceVisibility, z.null()]).optional(),
});
export type SpaceExt = z.infer<typeof SpaceExt>;

export const SpaceCreatePayload = z.object({ name: z.string() });
export type SpaceCreatePayload = z.infer<typeof SpaceCreatePayload>;

export const SpaceUpdatePayload = z
  .object({
    handle: z.union([z.string(), z.null()]),
    icon: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
    visibility: z.union([SpaceVisibility, z.null()]),
  })
  .partial();
export type SpaceUpdatePayload = z.infer<typeof SpaceUpdatePayload>;

export const NotificationLevel = z.enum(["ALL", "MENTIONS", "NOTHING"]);
export type NotificationLevel = z.infer<typeof NotificationLevel>;

export const NotificationPreference = z.object({
  level: NotificationLevel,
  spaceId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type NotificationPreference = z.infer<typeof NotificationPreference>;

export const NotificationPreferencePayload = z.object({
  level: NotificationLevel,
});
export type NotificationPreferencePayload = z.infer<
  typeof NotificationPreferencePayload
>;

export const ChannelCreatePayload = z.object({
  name: z.string(),
  parentId: z.union([z.string(), z.null()]).optional(),
  type: z.union([ChannelType, z.null()]).optional(),
});
export type ChannelCreatePayload = z.infer<typeof ChannelCreatePayload>;

export const ChannelPatch = z
  .object({ name: z.union([z.string(), z.null()]) })
  .partial();
export type ChannelPatch = z.infer<typeof ChannelPatch>;

export const MessageSendPayload2 = z.object({
  attachments: z.array(MessageAttachmentInput).optional().default([]),
  content: z.string(),
});
export type MessageSendPayload2 = z.infer<typeof MessageSendPayload2>;

export const MessageEditPayload2 = z.object({ content: z.string() });
export type MessageEditPayload2 = z.infer<typeof MessageEditPayload2>;

export const VoiceToken = z.object({
  channelId: z.string().uuid(),
  token: z.string(),
  url: z.string(),
});
export type VoiceToken = z.infer<typeof VoiceToken>;

export const Document = z.object({
  channelId: z.string().uuid(),
  content: z.string(),
  id: z.string().uuid(),
});
export type Document = z.infer<typeof Document>;

export const DocumentPatch = z
  .object({ content: z.union([z.string(), z.null()]) })
  .partial();
export type DocumentPatch = z.infer<typeof DocumentPatch>;

export const ClaimBootstrapResponse = z.object({
  shouldBootstrap: z.boolean(),
});
export type ClaimBootstrapResponse = z.infer<typeof ClaimBootstrapResponse>;

export const MemberExt = z.object({
  id: z.string().uuid(),
  name: z.union([z.string(), z.null()]).optional(),
  roleIds: z.array(z.string().uuid()),
  spaceId: z.string().uuid(),
  user: UserExt,
  userId: z.string().uuid(),
});
export type MemberExt = z.infer<typeof MemberExt>;

export const MemberCreatePayload = z.object({ userId: z.string().uuid() });
export type MemberCreatePayload = z.infer<typeof MemberCreatePayload>;

export const MemberUpdatePayload = z.object({
  roleIds: z.array(z.string().uuid()),
});
export type MemberUpdatePayload = z.infer<typeof MemberUpdatePayload>;

export const RoleCreatePayload = z.object({ name: z.string() });
export type RoleCreatePayload = z.infer<typeof RoleCreatePayload>;

export const RolePatch = z.object({
  color: z.union([z.string(), z.null()]).optional(),
  name: z.string(),
  permissions: z.string(),
  position: z.number().int(),
});
export type RolePatch = z.infer<typeof RolePatch>;

export const BanInfo = z.object({
  id: z.string().uuid(),
  reason: z.union([z.string(), z.null()]).optional(),
  spaceId: z.string().uuid(),
  user: z.union([User, z.null()]).optional(),
  userId: z.string().uuid(),
});
export type BanInfo = z.infer<typeof BanInfo>;

export const BanCreatePayload = z.object({
  reason: z.union([z.string(), z.null()]).optional(),
  userId: z.string().uuid(),
});
export type BanCreatePayload = z.infer<typeof BanCreatePayload>;

export const Invite = z.object({
  createdAt: Timestamp.datetime({ offset: true }),
  creatorId: z.string().uuid(),
  id: z.string(),
  spaceId: z.string().uuid(),
});
export type Invite = z.infer<typeof Invite>;

export const InviteCreatePayload = z.object({}).partial();
export type InviteCreatePayload = z.infer<typeof InviteCreatePayload>;

export const MessageSearchResult = z.object({
  attachments: z.array(MessageAttachment),
  author: z.union([User, z.null()]).optional(),
  authorId: z.union([z.string(), z.null()]).optional(),
  channelId: z.string().uuid(),
  content: z.string(),
  editedTimestamp: z.union([Timestamp, z.null()]).optional(),
  id: z.string().uuid(),
  snippet: z.string(),
  timestamp: Timestamp.datetime({ offset: true }),
});
export type MessageSearchResult = z.infer<typeof MessageSearchResult>;

export const DocumentSearchResult = z.object({
  channelId: z.string().uuid(),
  content: z.string(),
  id: z.string().uuid(),
  snippet: z.string(),
});
export type DocumentSearchResult = z.infer<typeof DocumentSearchResult>;

export const DocumentSearchQuery = z.object({
  channelId: z.union([z.string(), z.null()]).optional(),
  limit: z.union([z.number(), z.null()]).optional(),
  offset: z.union([z.number(), z.null()]).optional(),
  q: z.string(),
});
export type DocumentSearchQuery = z.infer<typeof DocumentSearchQuery>;

export const ListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial();
export type ListQuery = z.infer<typeof ListQuery>;

export const MemberListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial();
export type MemberListQuery = z.infer<typeof MemberListQuery>;

export const MessageKey = z.object({
  channelId: z.string().uuid(),
  messageId: z.string().uuid(),
});
export type MessageKey = z.infer<typeof MessageKey>;

export const MessageListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial();
export type MessageListQuery = z.infer<typeof MessageListQuery>;

export const MessageSearchQuery = z.object({
  authorId: z.union([z.string(), z.null()]).optional(),
  channelId: z.union([z.string(), z.null()]).optional(),
  limit: z.union([z.number(), z.null()]).optional(),
  offset: z.union([z.number(), z.null()]).optional(),
  q: z.string(),
});
export type MessageSearchQuery = z.infer<typeof MessageSearchQuery>;

export const ObjectWithId = z.object({ id: z.string().uuid() });
export type ObjectWithId = z.infer<typeof ObjectWithId>;

export const Ping = z.object({ message: z.string() });
export type Ping = z.infer<typeof Ping>;

export const ServeParams = z
  .object({
    h: z.union([z.number(), z.null()]),
    w: z.union([z.number(), z.null()]),
  })
  .partial();
export type ServeParams = z.infer<typeof ServeParams>;

export const TypingStart = z.object({ channelId: z.string() });
export type TypingStart = z.infer<typeof TypingStart>;

export const TypingUpdate = z.object({
  channelId: z.string(),
  userId: z.string(),
});
export type TypingUpdate = z.infer<typeof TypingUpdate>;

export const schemas = {
  IndexResponse,
  RegisterPayload,
  TokenPair,
  LoginPayload,
  RefreshPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  ResetPasswordConfirmData,
  UserCategory,
  UserExt,
  BotVisibility,
  BotInfo,
  CreateBotPayload,
  BotCreatedResponse,
  BotLoginPayload,
  UpdateBotPayload,
  BotSpaceInfo,
  InstallBotPayload,
  HandleOwner,
  HandleResolution,
  InstanceInfo,
  UserPatch,
  HandlePayload,
  VerifyHandleRequest,
  VerificationChallenge,
  VerificationResult,
  RelationState,
  RelationshipExt,
  Timestamp,
  ChannelType,
  Channel,
  cursor,
  limit,
  MessageAttachment,
  User,
  MessageExt,
  MessageAttachmentInput,
  MessageSendPayload,
  MessageEditPayload,
  ChannelUnread,
  PushConfig,
  SubscribePayload,
  SubscribeResponse,
  UnsubscribePayload,
  Role,
  SpaceType,
  SpaceVisibility,
  SpaceExt,
  SpaceCreatePayload,
  SpaceUpdatePayload,
  NotificationLevel,
  NotificationPreference,
  NotificationPreferencePayload,
  ChannelCreatePayload,
  ChannelPatch,
  MessageSendPayload2,
  MessageEditPayload2,
  VoiceToken,
  Document,
  DocumentPatch,
  ClaimBootstrapResponse,
  MemberExt,
  MemberCreatePayload,
  MemberUpdatePayload,
  RoleCreatePayload,
  RolePatch,
  BanInfo,
  BanCreatePayload,
  Invite,
  InviteCreatePayload,
  MessageSearchResult,
  DocumentSearchResult,
  DocumentSearchQuery,
  ListQuery,
  MemberListQuery,
  MessageKey,
  MessageListQuery,
  MessageSearchQuery,
  ObjectWithId,
  Ping,
  ServeParams,
  TypingStart,
  TypingUpdate,
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
    method: "get",
    path: "/.well-known/mikoto/instance.json",
    alias: "instance.info",
    description: `Returns instance information for federation, including the public key for verifying handle attestations.`,
    requestFormat: "json",
    response: InstanceInfo,
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
        schema: z.object({ email: z.string() }),
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
    response: z.array(BotInfo),
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
    response: BotCreatedResponse,
  },
  {
    method: "get",
    path: "/bots/:botId",
    alias: "bots.get",
    requestFormat: "json",
    response: BotInfo,
  },
  {
    method: "delete",
    path: "/bots/:botId",
    alias: "bots.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/bots/:botId",
    alias: "bots.update",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateBotPayload,
      },
    ],
    response: BotInfo,
  },
  {
    method: "post",
    path: "/bots/:botId/install",
    alias: "bots.install",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ spaceId: z.string().uuid() }),
      },
    ],
    response: z.null(),
  },
  {
    method: "post",
    path: "/bots/:botId/regenerate-token",
    alias: "bots.regenerateToken",
    requestFormat: "json",
    response: BotCreatedResponse,
  },
  {
    method: "get",
    path: "/bots/:botId/spaces",
    alias: "bots.listSpaces",
    requestFormat: "json",
    response: z.array(BotSpaceInfo),
  },
  {
    method: "delete",
    path: "/bots/:botId/spaces/:spaceId",
    alias: "bots.removeFromSpace",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "post",
    path: "/bots/login",
    alias: "bots.login",
    description: `Exchange a bot ID and secret token for a JWT access token.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BotLoginPayload,
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/dm/:channelId/ack",
    alias: "dm.acknowledge",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "get",
    path: "/dm/:channelId/messages/",
    alias: "dm.messages.list",
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
    path: "/dm/:channelId/messages/",
    alias: "dm.messages.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: MessageSendPayload,
      },
    ],
    response: MessageExt,
  },
  {
    method: "delete",
    path: "/dm/:channelId/messages/:messageId",
    alias: "dm.messages.delete",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/dm/:channelId/messages/:messageId",
    alias: "dm.messages.update",
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
    path: "/dm/unreads",
    alias: "dm.unreads",
    requestFormat: "json",
    response: z.array(ChannelUnread),
  },
  {
    method: "get",
    path: "/handles/:handle",
    alias: "handles.resolve",
    requestFormat: "json",
    response: HandleResolution,
  },
  {
    method: "get",
    path: "/push/config",
    alias: "push.config",
    requestFormat: "json",
    response: PushConfig,
  },
  {
    method: "post",
    path: "/push/subscribe",
    alias: "push.subscribe",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SubscribePayload,
      },
    ],
    response: z.object({ id: z.string().uuid() }),
  },
  {
    method: "post",
    path: "/push/unsubscribe",
    alias: "push.unsubscribe",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ endpoint: z.string() }),
      },
    ],
    response: z.null(),
  },
  {
    method: "get",
    path: "/relations/",
    alias: "relations.list",
    requestFormat: "json",
    response: z.array(RelationshipExt),
  },
  {
    method: "get",
    path: "/relations/:relationId",
    alias: "relations.get",
    requestFormat: "json",
    response: RelationshipExt,
  },
  {
    method: "delete",
    path: "/relations/:relationId",
    alias: "relations.remove",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "post",
    path: "/relations/:relationId/accept",
    alias: "relations.accept",
    requestFormat: "json",
    response: RelationshipExt,
  },
  {
    method: "post",
    path: "/relations/:relationId/block",
    alias: "relations.block",
    requestFormat: "json",
    response: RelationshipExt,
  },
  {
    method: "delete",
    path: "/relations/:relationId/block",
    alias: "relations.unblock",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "post",
    path: "/relations/:relationId/decline",
    alias: "relations.decline",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "post",
    path: "/relations/:relationId/dm",
    alias: "relations.openDm",
    requestFormat: "json",
    response: Channel,
  },
  {
    method: "post",
    path: "/relations/:relationId/request",
    alias: "relations.sendRequest",
    requestFormat: "json",
    response: RelationshipExt,
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
    path: "/spaces/:spaceId/bans/",
    alias: "bans.list",
    requestFormat: "json",
    response: z.array(BanInfo),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/bans/",
    alias: "bans.create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BanCreatePayload,
      },
    ],
    response: BanInfo,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/bans/:userId",
    alias: "bans.delete",
    requestFormat: "json",
    response: z.null(),
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
    method: "post",
    path: "/spaces/:spaceId/channels/:channelId/ack",
    alias: "channels.acknowledge",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/:channelId/documents/",
    alias: "documents.get",
    requestFormat: "json",
    response: Document,
  },
  {
    method: "patch",
    path: "/spaces/:spaceId/channels/:channelId/documents/",
    alias: "documents.update",
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
    method: "post",
    path: "/spaces/:spaceId/channels/:channelId/documents/claim-bootstrap",
    alias: "documents.claimBootstrap",
    requestFormat: "json",
    response: z.object({ shouldBootstrap: z.boolean() }),
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
        schema: MessageSendPayload2,
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
    response: VoiceToken,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/channels/unreads",
    alias: "channels.unreads",
    requestFormat: "json",
    response: z.array(ChannelUnread),
  },
  {
    method: "post",
    path: "/spaces/:spaceId/handle/verify",
    alias: "spaces.startHandleVerification",
    description: `Generates a verification challenge for a custom domain handle. Returns the DNS TXT record and well-known file content to add for verification.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Request to initiate handle verification`,
        type: "Body",
        schema: z.object({ handle: z.string() }),
      },
    ],
    response: VerificationChallenge,
  },
  {
    method: "post",
    path: "/spaces/:spaceId/handle/verify/complete",
    alias: "spaces.completeHandleVerification",
    description: `Verifies the custom domain by checking DNS TXT records or well-known files. On success, updates the space&#x27;s handle to the verified domain.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Request to initiate handle verification`,
        type: "Body",
        schema: z.object({ handle: z.string() }),
      },
    ],
    response: VerificationResult,
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
    path: "/spaces/:spaceId/members/:userId/roles/:roleId",
    alias: "members.addRole",
    requestFormat: "json",
    response: MemberExt,
  },
  {
    method: "delete",
    path: "/spaces/:spaceId/members/:userId/roles/:roleId",
    alias: "members.removeRole",
    requestFormat: "json",
    response: MemberExt,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/notification-preference",
    alias: "spaces.getNotificationPreference",
    requestFormat: "json",
    response: NotificationPreference,
  },
  {
    method: "post",
    path: "/spaces/:spaceId/notification-preference",
    alias: "spaces.setNotificationPreference",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: NotificationPreferencePayload,
      },
    ],
    response: NotificationPreference,
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
        schema: RolePatch,
      },
    ],
    response: Role,
  },
  {
    method: "get",
    path: "/spaces/:spaceId/search/documents",
    alias: "search.documents",
    requestFormat: "json",
    parameters: [
      {
        name: "channelId",
        type: "Query",
        schema: cursor,
      },
      {
        name: "limit",
        type: "Query",
        schema: limit,
      },
      {
        name: "offset",
        type: "Query",
        schema: limit,
      },
      {
        name: "q",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.array(DocumentSearchResult),
  },
  {
    method: "get",
    path: "/spaces/:spaceId/search/messages",
    alias: "search.messages",
    requestFormat: "json",
    parameters: [
      {
        name: "authorId",
        type: "Query",
        schema: cursor,
      },
      {
        name: "channelId",
        type: "Query",
        schema: cursor,
      },
      {
        name: "limit",
        type: "Query",
        schema: limit,
      },
      {
        name: "offset",
        type: "Query",
        schema: limit,
      },
      {
        name: "q",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.array(MessageSearchResult),
  },
  {
    method: "get",
    path: "/spaces/join/:invite",
    alias: "spaces.preview",
    requestFormat: "json",
    response: SpaceExt,
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
    path: "/spaces/notification-preferences",
    alias: "spaces.listNotificationPreferences",
    requestFormat: "json",
    response: z.array(NotificationPreference),
  },
  {
    method: "get",
    path: "/users/me",
    alias: "user.get",
    requestFormat: "json",
    response: UserExt,
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
    response: UserExt,
  },
  {
    method: "post",
    path: "/users/me/handle",
    alias: "user.setHandle",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ handle: z.string() }),
      },
    ],
    response: UserExt,
  },
  {
    method: "delete",
    path: "/users/me/handle",
    alias: "user.deleteHandle",
    requestFormat: "json",
    response: UserExt,
  },
  {
    method: "post",
    path: "/users/me/handle/verify",
    alias: "user.startHandleVerification",
    description: `Generates a verification challenge for a custom domain handle. Returns the DNS TXT record and well-known file content to add for verification.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Request to initiate handle verification`,
        type: "Body",
        schema: z.object({ handle: z.string() }),
      },
    ],
    response: VerificationChallenge,
  },
  {
    method: "post",
    path: "/users/me/handle/verify/complete",
    alias: "user.completeHandleVerification",
    description: `Verifies the custom domain by checking DNS TXT records or well-known files. On success, updates the user&#x27;s handle to the verified domain.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Request to initiate handle verification`,
        type: "Body",
        schema: z.object({ handle: z.string() }),
      },
    ],
    response: VerificationResult,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

export const websocketCommands = {
  ping: Ping,
  "typing.start": TypingStart,
};

export const websocketEvents = {
  "channels.onCreate": Channel,
  "channels.onDelete": Channel,
  "channels.onUpdate": Channel,
  "members.onCreate": MemberExt,
  "members.onDelete": MemberExt,
  "members.onUpdate": MemberExt,
  "messages.onCreate": MessageExt,
  "messages.onDelete": MessageKey,
  "messages.onUpdate": MessageExt,
  pong: Ping,
  "relations.onCreate": RelationshipExt,
  "relations.onDelete": ObjectWithId,
  "relations.onUpdate": RelationshipExt,
  "roles.onCreate": Role,
  "roles.onDelete": Role,
  "roles.onUpdate": Role,
  "spaces.onCreate": SpaceExt,
  "spaces.onDelete": SpaceExt,
  "spaces.onUpdate": SpaceExt,
  "typing.onUpdate": TypingUpdate,
  "users.onCreate": UserExt,
  "users.onDelete": ObjectWithId,
  "users.onUpdate": UserExt,
};

export type Api = typeof api;

type WebsocketEventValidators = typeof websocketEvents;
export type WebsocketEvents = {
  [K in keyof WebsocketEventValidators]: (
    event: z.infer<WebsocketEventValidators[K]>
  ) => void;
};

export type WebsocketEventEmitter = TypedEventEmitter<WebsocketEvents>;
