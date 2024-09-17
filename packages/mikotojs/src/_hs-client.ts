// Generated by Hyperschema compiler. Do not edit manually!
import { z } from "zod";
import { HyperschemaClient, RootService } from "@hyperschema/client";

export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.nullable(z.string()),
  category: z.nullable(z.string()),
});
export type User = z.infer<typeof User>;

export const UserStatus = z.object({
  presence: z.nullable(z.string()),
  content: z.nullable(z.string()),
});
export type UserStatus = z.infer<typeof UserStatus>;

export const UserProfile = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.nullable(z.string()),
  category: z.nullable(z.string()),
  description: z.nullable(z.string()),
  status: z.nullable(UserStatus),
});
export type UserProfile = z.infer<typeof UserProfile>;

export const Role = z.object({
  id: z.string(),
  name: z.string(),
  color: z.nullable(z.string()),
  spaceId: z.string(),
  permissions: z.string(),
  position: z.number().int(),
});
export type Role = z.infer<typeof Role>;

export const Channel = z.object({
  id: z.string(),
  spaceId: z.string(),
  parentId: z.nullable(z.string()),
  name: z.string(),
  order: z.number().int(),
  lastUpdated: z.nullable(z.string()),
  type: z.string(),
});
export type Channel = z.infer<typeof Channel>;

export const Space = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  icon: z.nullable(z.string()),
  channels: z.array(Channel),
  roles: z.array(Role),
  ownerId: z.nullable(z.string()),
});
export type Space = z.infer<typeof Space>;

export const Member = z.object({
  id: z.string(),
  spaceId: z.string(),
  user: User,
  roleIds: z.array(z.string()),
});
export type Member = z.infer<typeof Member>;

export const Message = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.string(),
  editedTimestamp: z.nullable(z.string()),
  authorId: z.nullable(z.string()),
  author: z.nullable(User),
  channelId: z.string(),
});
export type Message = z.infer<typeof Message>;

export const Invite = z.object({
  code: z.string(),
});
export type Invite = z.infer<typeof Invite>;

export const Unread = z.object({
  channelId: z.string(),
  timestamp: z.string(),
});
export type Unread = z.infer<typeof Unread>;

export const Relation = z.object({
  id: z.string(),
  relation: z.nullable(User),
  space: z.nullable(Space),
});
export type Relation = z.infer<typeof Relation>;

export const Document = z.object({
  id: z.string(),
  channelId: z.string(),
  content: z.string(),
});
export type Document = z.infer<typeof Document>;

export const TypingEvent = z.object({
  channelId: z.string(),
  userId: z.string(),
  memberId: z.string(),
});
export type TypingEvent = z.infer<typeof TypingEvent>;

export const MessageDeleteEvent = z.object({
  messageId: z.string(),
  channelId: z.string(),
});
export type MessageDeleteEvent = z.infer<typeof MessageDeleteEvent>;

export const VoiceToken = z.object({
  url: z.string(),
  channelId: z.string(),
  token: z.string(),
});
export type VoiceToken = z.infer<typeof VoiceToken>;

export const SpaceUpdateOptions = z.object({
  name: z.nullable(z.string()),
  icon: z.nullable(z.string()),
});
export type SpaceUpdateOptions = z.infer<typeof SpaceUpdateOptions>;

export const ChannelCreateOptions = z.object({
  name: z.string(),
  type: z.string(),
  parentId: z.nullable(z.string()),
});
export type ChannelCreateOptions = z.infer<typeof ChannelCreateOptions>;

export const ChannelUpdateOptions = z.object({
  name: z.nullable(z.string()),
});
export type ChannelUpdateOptions = z.infer<typeof ChannelUpdateOptions>;

export const MemberUpdateOptions = z.object({
  roleIds: z.array(z.string()),
});
export type MemberUpdateOptions = z.infer<typeof MemberUpdateOptions>;

export const RoleEditPayload = z.object({
  name: z.nullable(z.string()),
  color: z.nullable(z.string()),
  permissions: z.nullable(z.string()),
  position: z.nullable(z.number().int()),
});
export type RoleEditPayload = z.infer<typeof RoleEditPayload>;

export const UserUpdateOptions = z.object({
  name: z.nullable(z.string()),
  avatar: z.nullable(z.string()),
});
export type UserUpdateOptions = z.infer<typeof UserUpdateOptions>;

export class MainService extends RootService {
  readonly PATH = "";
  readonly channels: ChannelService;
  readonly documents: DocumentService;
  readonly spaces: SpaceService;
  readonly members: MemberService;
  readonly users: UserService;
  readonly messages: MessageService;
  readonly roles: RoleService;
  readonly voice: VoiceService;
  readonly relations: RelationService;

  constructor(protected client: HyperschemaClient) {
    super();
    this.channels = new ChannelService(this.client);
    this.documents = new DocumentService(this.client);
    this.spaces = new SpaceService(this.client);
    this.members = new MemberService(this.client);
    this.users = new UserService(this.client);
    this.messages = new MessageService(this.client);
    this.roles = new RoleService(this.client);
    this.voice = new VoiceService(this.client);
    this.relations = new RelationService(this.client);
  }
  ping(input: {}): Promise<string> {
    return this.client.call("ping", input);
  }
}

export class ChannelService {
  readonly PATH = "channels";

  constructor(protected client: HyperschemaClient) {}
  get(input: { channelId: string }): Promise<Channel> {
    return this.client.call("channels/get", input);
  }
  list(input: { spaceId: string }): Promise<Array<Channel>> {
    return this.client.call("channels/list", input);
  }
  create(input: {
    spaceId: string;
    name: string;
    parentId: string | null;
    type: string;
  }): Promise<Channel> {
    return this.client.call("channels/create", input);
  }
  update(input: {
    channelId: string;
    options: ChannelUpdateOptions;
  }): Promise<Channel> {
    return this.client.call("channels/update", input);
  }
  delete(input: { channelId: string }): Promise<Channel> {
    return this.client.call("channels/delete", input);
  }

  onCreate(cb: (data: Channel) => void): () => void {
    return this.client.on("channels/onCreate", cb);
  }
  onUpdate(cb: (data: Channel) => void): () => void {
    return this.client.on("channels/onUpdate", cb);
  }
  onDelete(cb: (data: Channel) => void): () => void {
    return this.client.on("channels/onDelete", cb);
  }
}

export class DocumentService {
  readonly PATH = "documents";

  constructor(protected client: HyperschemaClient) {}
  get(input: { channelId: string }): Promise<Document> {
    return this.client.call("documents/get", input);
  }
  update(input: { channelId: string; content: string }): Promise<Document> {
    return this.client.call("documents/update", input);
  }
}

export class MemberService {
  readonly PATH = "members";

  constructor(protected client: HyperschemaClient) {}
  get(input: { spaceId: string; userId: string }): Promise<Member> {
    return this.client.call("members/get", input);
  }
  list(input: { spaceId: string }): Promise<Array<Member>> {
    return this.client.call("members/list", input);
  }
  create(input: { spaceId: string; userId: string }): Promise<Member> {
    return this.client.call("members/create", input);
  }
  update(input: {
    spaceId: string;
    userId: string;
    options: MemberUpdateOptions;
  }): Promise<Member> {
    return this.client.call("members/update", input);
  }
  delete(input: { spaceId: string; userId: string }): Promise<Member> {
    return this.client.call("members/delete", input);
  }

  onCreate(cb: (data: Member) => void): () => void {
    return this.client.on("members/onCreate", cb);
  }
  onUpdate(cb: (data: Member) => void): () => void {
    return this.client.on("members/onUpdate", cb);
  }
  onDelete(cb: (data: Member) => void): () => void {
    return this.client.on("members/onDelete", cb);
  }
}

export class MessageService {
  readonly PATH = "messages";

  constructor(protected client: HyperschemaClient) {}
  list(input: {
    channelId: string;
    cursor: string | null;
    limit: number;
  }): Promise<Array<Message>> {
    return this.client.call("messages/list", input);
  }
  send(input: { channelId: string; content: string }): Promise<Message> {
    return this.client.call("messages/send", input);
  }
  edit(input: {
    channelId: string;
    messageId: string;
    content: string;
  }): Promise<Message> {
    return this.client.call("messages/edit", input);
  }
  editUncommitted(input: {
    channelId: string;
    messageId: string;
    content: string;
  }): Promise<Message> {
    return this.client.call("messages/editUncommitted", input);
  }
  delete(input: { channelId: string; messageId: string }): Promise<Message> {
    return this.client.call("messages/delete", input);
  }
  startTyping(input: { channelId: string }): Promise<TypingEvent> {
    return this.client.call("messages/startTyping", input);
  }
  ack(input: { channelId: string; timestamp: string }): Promise<Unread> {
    return this.client.call("messages/ack", input);
  }
  listUnread(input: { spaceId: string }): Promise<Array<Unread>> {
    return this.client.call("messages/listUnread", input);
  }

  onCreate(cb: (data: Message) => void): () => void {
    return this.client.on("messages/onCreate", cb);
  }
  onUpdate(cb: (data: Message) => void): () => void {
    return this.client.on("messages/onUpdate", cb);
  }
  onDelete(cb: (data: Message) => void): () => void {
    return this.client.on("messages/onDelete", cb);
  }
  onTypingStart(cb: (data: TypingEvent) => void): () => void {
    return this.client.on("messages/onTypingStart", cb);
  }
}

export class RoleService {
  readonly PATH = "roles";

  constructor(protected client: HyperschemaClient) {}
  create(input: { spaceId: string; name: string }): Promise<Role> {
    return this.client.call("roles/create", input);
  }
  edit(input: {
    spaceId: string;
    roleId: string;
    options: RoleEditPayload;
  }): Promise<Role> {
    return this.client.call("roles/edit", input);
  }
  delete(input: { spaceId: string; roleId: string }): Promise<Role> {
    return this.client.call("roles/delete", input);
  }

  onCreate(cb: (data: Role) => void): () => void {
    return this.client.on("roles/onCreate", cb);
  }
  onUpdate(cb: (data: Role) => void): () => void {
    return this.client.on("roles/onUpdate", cb);
  }
  onDelete(cb: (data: Role) => void): () => void {
    return this.client.on("roles/onDelete", cb);
  }
}

export class SpaceService {
  readonly PATH = "spaces";

  constructor(protected client: HyperschemaClient) {}
  get(input: { spaceId: string }): Promise<Space> {
    return this.client.call("spaces/get", input);
  }
  list(input: {}): Promise<Array<Space>> {
    return this.client.call("spaces/list", input);
  }
  create(input: { name: string }): Promise<Space> {
    return this.client.call("spaces/create", input);
  }
  update(input: {
    spaceId: string;
    options: SpaceUpdateOptions;
  }): Promise<Space> {
    return this.client.call("spaces/update", input);
  }
  delete(input: { spaceId: string }): Promise<Space> {
    return this.client.call("spaces/delete", input);
  }
  getSpaceFromInvite(input: { inviteCode: string }): Promise<Space> {
    return this.client.call("spaces/getSpaceFromInvite", input);
  }
  join(input: { inviteCode: string }): Promise<Space> {
    return this.client.call("spaces/join", input);
  }
  leave(input: { spaceId: string }): Promise<Space> {
    return this.client.call("spaces/leave", input);
  }
  createInvite(input: { spaceId: string }): Promise<Invite> {
    return this.client.call("spaces/createInvite", input);
  }
  listInvites(input: { spaceId: string }): Promise<Array<Invite>> {
    return this.client.call("spaces/listInvites", input);
  }
  deleteInvite(input: {
    spaceId: string;
    inviteCode: string;
  }): Promise<string> {
    return this.client.call("spaces/deleteInvite", input);
  }

  onCreate(cb: (data: Space) => void): () => void {
    return this.client.on("spaces/onCreate", cb);
  }
  onUpdate(cb: (data: Space) => void): () => void {
    return this.client.on("spaces/onUpdate", cb);
  }
  onDelete(cb: (data: Space) => void): () => void {
    return this.client.on("spaces/onDelete", cb);
  }
}

export class UserService {
  readonly PATH = "users";

  constructor(protected client: HyperschemaClient) {}
  me(input: {}): Promise<User> {
    return this.client.call("users/me", input);
  }
  update(input: { options: UserUpdateOptions }): Promise<User> {
    return this.client.call("users/update", input);
  }

  onCreate(cb: (data: User) => void): () => void {
    return this.client.on("users/onCreate", cb);
  }
  onUpdate(cb: (data: User) => void): () => void {
    return this.client.on("users/onUpdate", cb);
  }
  onDelete(cb: (data: User) => void): () => void {
    return this.client.on("users/onDelete", cb);
  }
}

export class VoiceService {
  readonly PATH = "voice";

  constructor(protected client: HyperschemaClient) {}
  join(input: { channelId: string }): Promise<VoiceToken> {
    return this.client.call("voice/join", input);
  }
}

export class RelationService {
  readonly PATH = "relations";

  constructor(protected client: HyperschemaClient) {}
  get(input: { relationId: string }): Promise<Relation> {
    return this.client.call("relations/get", input);
  }
  list(input: {}): Promise<Array<Relation>> {
    return this.client.call("relations/list", input);
  }
  openDm(input: { relationId: string }): Promise<Relation> {
    return this.client.call("relations/openDm", input);
  }
}