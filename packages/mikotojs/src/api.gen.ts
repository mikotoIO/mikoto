// GENERATED
import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const IndexResponse = z
  .object({ name: z.string(), version: z.string() })
  .passthrough();
const RegisterPayload = z
  .object({
    captcha: z.union([z.string(), z.null()]).optional(),
    email: z.string(),
    name: z.string(),
    password: z.string(),
  })
  .passthrough();
const TokenPair = z
  .object({
    accessToken: z.string(),
    refreshToken: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const LoginPayload = z
  .object({ email: z.string(), password: z.string() })
  .passthrough();
const RefreshPayload = z.object({ refreshToken: z.string() }).passthrough();
const ChangePasswordPayload = z
  .object({
    id: z.string().uuid(),
    newPassword: z.string(),
    oldPassword: z.string(),
  })
  .passthrough();
const ResetPasswordPayload = z
  .object({
    captcha: z.union([z.string(), z.null()]).optional(),
    email: z.string(),
  })
  .passthrough();
const ResetPasswordConfirmData = z
  .object({ password: z.string(), token: z.string() })
  .passthrough();
const Bot = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.string().uuid(),
    secret: z.string(),
  })
  .passthrough();
const CreateBotPayload = z.object({ name: z.string() }).passthrough();
const UserCategory = z.enum(["BOT", "UNVERIFIED"]);
const User = z
  .object({
    avatar: z.union([z.string(), z.null()]).optional(),
    category: z.union([UserCategory, z.null()]).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    id: z.string().uuid(),
    name: z.string(),
  })
  .passthrough();
const UserPatch = z
  .object({
    avatar: z.union([z.string(), z.null()]).optional(),
    name: z.string(),
  })
  .passthrough();
const RelationState = z.enum([
  "NONE",
  "FRIEND",
  "BLOCKED",
  "INCOMING_REQUEST",
  "OUTGOING_REQUEST",
]);
const Relationship = z
  .object({
    id: z.string().uuid(),
    relationId: z.string().uuid(),
    spaceId: z.union([z.string(), z.null()]).optional(),
    state: RelationState,
    userId: z.string().uuid(),
  })
  .passthrough();
const ChannelType = z.enum([
  "TEXT",
  "VOICE",
  "DOCUMENT",
  "APPLICATION",
  "THREAD",
  "CATEGORY",
]);
const Channel = z
  .object({
    id: z.string().uuid(),
    lastUpdated: z.union([z.string(), z.null()]).optional(),
    name: z.string(),
    order: z.number().int(),
    parentId: z.union([z.string(), z.null()]).optional(),
    spaceId: z.string().uuid(),
    type: ChannelType,
  })
  .passthrough();
const Role = z
  .object({
    color: z.union([z.string(), z.null()]).optional(),
    id: z.string().uuid(),
    name: z.string(),
    permissions: z.string(),
    position: z.number().int(),
    spaceId: z.string().uuid(),
  })
  .passthrough();
const SpaceType = z.enum(["NONE", "DM", "GROUP"]);
const SpaceExt = z
  .object({
    channels: z.array(Channel),
    icon: z.union([z.string(), z.null()]).optional(),
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.union([z.string(), z.null()]).optional(),
    roles: z.array(Role),
    type: SpaceType,
  })
  .passthrough();
const SpaceCreatePayload = z.object({ name: z.string() }).passthrough();
const SpaceUpdatePayload = z
  .object({
    icon: z.union([z.string(), z.null()]),
    name: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough();
const ChannelCreatePayload = z
  .object({
    name: z.string(),
    parentId: z.union([z.string(), z.null()]).optional(),
    type: z.union([ChannelType, z.null()]).optional(),
  })
  .passthrough();
const ChannelPatch = z
  .object({ name: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough();
const cursor = z.union([z.string(), z.null()]).optional();
const limit = z.union([z.number(), z.null()]).optional();
const Message = z
  .object({
    authorId: z.string().uuid(),
    channelId: z.string().uuid(),
    content: z.string(),
    editedTimestamp: z.union([z.string(), z.null()]).optional(),
    id: z.string().uuid(),
    timestamp: z.string(),
  })
  .passthrough();
const MessageExt = z.object({ author: User, base: Message }).passthrough();
const MessageSendPayload = z.object({ content: z.string() }).passthrough();
const MessageEditPayload = z.object({ content: z.string() }).passthrough();
const Document = z
  .object({
    channelId: z.string().uuid(),
    content: z.string(),
    id: z.string().uuid(),
  })
  .passthrough();
const DocumentPatch = z
  .object({ content: z.union([z.string(), z.null()]) })
  .partial()
  .passthrough();
const MemberExt = z
  .object({
    id: z.string().uuid(),
    name: z.union([z.string(), z.null()]).optional(),
    roleIds: z.array(z.string().uuid()),
    spaceId: z.string().uuid(),
    user: User,
    userId: z.string().uuid(),
  })
  .passthrough();
const MemberCreatePayload = z
  .object({ userId: z.string().uuid() })
  .passthrough();
const MemberUpdatePayload = z
  .object({ roleIds: z.array(z.string().uuid()) })
  .passthrough();
const RoleCreatePayload = z.object({ name: z.string() }).passthrough();
const RoleUpdatePayload = z.object({ name: z.string() }).passthrough();
const ListQuery = z
  .object({
    cursor: z.union([z.string(), z.null()]),
    limit: z.union([z.number(), z.null()]),
  })
  .partial()
  .passthrough();
const MemberKey = z
  .object({ spaceId: z.string().uuid(), userId: z.string().uuid() })
  .passthrough();
const MessageKey = z
  .object({ channelId: z.string().uuid(), messageId: z.string().uuid() })
  .passthrough();
const ObjectWithId = z.object({ id: z.string().uuid() }).passthrough();
const Ping = z.object({ message: z.string() }).passthrough();

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
  Message,
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
    requestFormat: "json",
    response: IndexResponse,
  },
  {
    method: "post",
    path: "/account/change_password",
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
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ refreshToken: z.string() }).passthrough(),
      },
    ],
    response: TokenPair,
  },
  {
    method: "post",
    path: "/account/register",
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
    requestFormat: "json",
    response: z.array(Bot),
  },
  {
    method: "post",
    path: "/bots/",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: Bot,
  },
  {
    method: "get",
    path: "/relations/",
    requestFormat: "json",
    response: z.array(Relationship),
  },
  {
    method: "get",
    path: "/relations/:id",
    requestFormat: "json",
    response: Relationship,
  },
  {
    method: "post",
    path: "/relations/:id/dm",
    requestFormat: "json",
    response: User,
  },
  {
    method: "get",
    path: "/spaces/",
    requestFormat: "json",
    response: z.array(SpaceExt),
  },
  {
    method: "post",
    path: "/spaces/",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: SpaceExt,
  },
  {
    method: "get",
    path: "/spaces/:id",
    requestFormat: "json",
    response: SpaceExt,
  },
  {
    method: "delete",
    path: "/spaces/:id",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:id",
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
    method: "delete",
    path: "/spaces/:id/leave",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "get",
    path: "/spaces/:space_id/channel/:channel_id/documents/",
    requestFormat: "json",
    response: Document,
  },
  {
    method: "patch",
    path: "/spaces/:space_id/channel/:channel_id/documents/",
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
    path: "/spaces/:space_id/channel/:channel_id/messages/",
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
    path: "/spaces/:space_id/channel/:channel_id/messages/",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ content: z.string() }).passthrough(),
      },
    ],
    response: MessageExt,
  },
  {
    method: "get",
    path: "/spaces/:space_id/channel/:channel_id/messages/:id",
    requestFormat: "json",
    response: MessageExt,
  },
  {
    method: "delete",
    path: "/spaces/:space_id/channel/:channel_id/messages/:id",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:space_id/channel/:channel_id/messages/:id",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ content: z.string() }).passthrough(),
      },
    ],
    response: MessageExt,
  },
  {
    method: "get",
    path: "/spaces/:space_id/channels/",
    requestFormat: "json",
    response: z.array(Channel),
  },
  {
    method: "post",
    path: "/spaces/:space_id/channels/",
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
    method: "post",
    path: "/spaces/:space_id/channels/:channel_id/voice/",
    requestFormat: "json",
    response: Document,
  },
  {
    method: "get",
    path: "/spaces/:space_id/channels/:id",
    requestFormat: "json",
    response: Channel,
  },
  {
    method: "delete",
    path: "/spaces/:space_id/channels/:id",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:space_id/channels/:id",
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
    path: "/spaces/:space_id/members/",
    requestFormat: "json",
    response: z.array(MemberExt),
  },
  {
    method: "post",
    path: "/spaces/:space_id/members/",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ userId: z.string().uuid() }).passthrough(),
      },
    ],
    response: MemberExt,
  },
  {
    method: "get",
    path: "/spaces/:space_id/members/:id",
    requestFormat: "json",
    response: MemberExt,
  },
  {
    method: "delete",
    path: "/spaces/:space_id/members/:id",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:space_id/members/:id",
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
    path: "/spaces/:space_id/roles/",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: Role,
  },
  {
    method: "delete",
    path: "/spaces/:space_id/roles/:role_id",
    requestFormat: "json",
    response: z.null(),
  },
  {
    method: "patch",
    path: "/spaces/:space_id/roles/:role_id",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: Role,
  },
  {
    method: "post",
    path: "/spaces/join",
    requestFormat: "json",
    response: SpaceExt,
  },
  {
    method: "get",
    path: "/users/me",
    requestFormat: "json",
    response: User,
  },
  {
    method: "patch",
    path: "/users/me",
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

// Mikoto Superego

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
