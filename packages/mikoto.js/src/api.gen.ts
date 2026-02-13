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
  captcha: z.union([z.string(), z.null()]).optional(),
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
  id: z.string().uuid(),
  newPassword: z.string(),
  oldPassword: z.string(),
});
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayload>;

export const ResetPasswordPayload = z.object({
  captcha: z.union([z.string(), z.null()]).optional(),
  email: z.string(),
});
export type ResetPasswordPayload = z.infer<typeof ResetPasswordPayload>;

export const ResetPasswordConfirmData = z.object({
  password: z.string(),
  token: z.string(),
});
export type ResetPasswordConfirmData = z.infer<typeof ResetPasswordConfirmData>;

export const Bot = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.string().uuid(),
  secret: z.string(),
});
export type Bot = z.infer<typeof Bot>;

export const CreateBotPayload = z.object({ name: z.string() });
export type CreateBotPayload = z.infer<typeof CreateBotPayload>;

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

export const Relationship = z.object({
  id: z.string().uuid(),
  relationId: z.string().uuid(),
  spaceId: z.union([z.string(), z.null()]).optional(),
  state: RelationState,
  userId: z.string().uuid(),
});
export type Relationship = z.infer<typeof Relationship>;

export const User = z.object({
  avatar: z.union([z.string(), z.null()]).optional(),
  category: z.union([UserCategory, z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
});
export type User = z.infer<typeof User>;

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
  spaceId: z.string().uuid(),
  type: ChannelType,
});
export type Channel = z.infer<typeof Channel>;

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

export const SpaceExt = z.object({
  channels: z.array(Channel),
  handle: z.union([z.string(), z.null()]).optional(),
  icon: z.union([z.string(), z.null()]).optional(),
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.union([z.string(), z.null()]).optional(),
  roles: z.array(Role),
  type: SpaceType,
});
export type SpaceExt = z.infer<typeof SpaceExt>;

export const SpaceCreatePayload = z.object({ name: z.string() });
export type SpaceCreatePayload = z.infer<typeof SpaceCreatePayload>;

export const SpaceUpdatePayload = z
  .object({
    handle: z.union([z.string(), z.null()]),
    icon: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
  })
  .partial();
export type SpaceUpdatePayload = z.infer<typeof SpaceUpdatePayload>;

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

export const ChannelUnread = z.object({
  channelId: z.string().uuid(),
  timestamp: Timestamp.datetime({ offset: true }),
  userId: z.string().uuid(),
});
export type ChannelUnread = z.infer<typeof ChannelUnread>;

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

export const Invite = z.object({
  createdAt: Timestamp.datetime({ offset: true }),
  creatorId: z.string().uuid(),
  id: z.string(),
  spaceId: z.string().uuid(),
});
export type Invite = z.infer<typeof Invite>;

export const InviteCreatePayload = z.object({}).partial();
export type InviteCreatePayload = z.infer<typeof InviteCreatePayload>;

export const ListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial();
export type ListQuery = z.infer<typeof ListQuery>;

export const MessageKey = z.object({
  channelId: z.string().uuid(),
  messageId: z.string().uuid(),
});
export type MessageKey = z.infer<typeof MessageKey>;

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
  HandleOwner,
  HandleResolution,
  InstanceInfo,
  UserCategory,
  UserExt,
  UserPatch,
  HandlePayload,
  VerifyHandleRequest,
  VerificationChallenge,
  VerificationResult,
  RelationState,
  Relationship,
  User,
  Timestamp,
  ChannelType,
  Channel,
  Role,
  SpaceType,
  SpaceExt,
  SpaceCreatePayload,
  SpaceUpdatePayload,
  ChannelCreatePayload,
  ChannelPatch,
  ChannelUnread,
  cursor,
  limit,
  MessageAttachment,
  MessageExt,
  MessageAttachmentInput,
  MessageSendPayload,
  MessageEditPayload,
  VoiceToken,
  Document,
  DocumentPatch,
  MemberExt,
  MemberCreatePayload,
  MemberUpdatePayload,
  RoleCreatePayload,
  RolePatch,
  Invite,
  InviteCreatePayload,
  ListQuery,
  MessageKey,
  ObjectWithId,
  Ping,
  ServeParams,
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
    path: "/handles/:handle",
    alias: "handles.resolve",
    requestFormat: "json",
    response: HandleResolution,
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
        schema: MessageSendPayload,
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
  "roles.onCreate": Role,
  "roles.onDelete": Role,
  "roles.onUpdate": Role,
  "spaces.onCreate": SpaceExt,
  "spaces.onDelete": SpaceExt,
  "spaces.onUpdate": SpaceExt,
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
