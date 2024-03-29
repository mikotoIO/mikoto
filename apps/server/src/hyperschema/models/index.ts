/* eslint-disable @typescript-eslint/no-redeclare */
import { hsDate } from '@hyperschema/core';
import { z } from 'zod';

export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  category: z.string().nullable(),
});
export type User = z.infer<typeof User>;

export const UserStatus = z.object({
  presence: z.string().nullable(),
  content: z.string().nullable(),
});

export const UserProfile = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  category: z.string().nullable(),

  description: z.string().nullable(),
  status: UserStatus.nullable(),
});

export const Role = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  spaceId: z.string(),
  permissions: z.string(),
  position: z.number().int(),
});
export type Role = z.infer<typeof Role>;

export const Channel = z.object({
  id: z.string(),
  spaceId: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  order: z.number().int(),
  lastUpdated: z.nullable(hsDate()),
  type: z.string(),
});
export type Channel = z.infer<typeof Channel>;

export const Space = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  icon: z.string().nullable(),
  channels: Channel.array(),
  roles: Role.array(),
  ownerId: z.string().nullable(),
});
export type Space = z.infer<typeof Space>;

export const Member = z.object({
  id: z.string(),
  spaceId: z.string(),
  user: User,
  roleIds: z.string().array(),
});
export type Member = z.infer<typeof Member>;

export const Message = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: hsDate(),
  editedTimestamp: z.nullable(hsDate()),
  authorId: z.string().nullable(),
  author: User.nullable(),
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
  relation: User.nullable(),
  space: Space.nullable(),
});
export type Relation = z.infer<typeof Relation>;

export const Document = z.object({
  id: z.string(),
  channelId: z.string(),
  content: z.string(),
});
export type Document = z.infer<typeof Document>;

// various events

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

// extras

export const SpaceUpdateOptions = z.object({
  name: z.string().nullable(),
  icon: z.string().nullable(),
});

export const ChannelCreateOptions = z.object({
  name: z.string(),
  type: z.string(),
  parentId: z.string().nullable(),
});

export const ChannelUpdateOptions = z.object({
  name: z.string().nullable(),
});
