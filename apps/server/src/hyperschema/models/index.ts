/* eslint-disable @typescript-eslint/no-redeclare */
import { hsDate } from '@hyperschema/core';
import { z } from 'zod';

export const User = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.nullable(z.string()),
  category: z.nullable(z.string()),
});
export type User = z.infer<typeof User>;

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
  lastUpdated: z.nullable(hsDate()),
  type: z.string(),
});
export type Channel = z.infer<typeof Channel>;

export const Space = z.object({
  id: z.string(),
  name: z.string(),
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
  timestamp: hsDate(),
  editedTimestamp: z.nullable(hsDate()),
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

export const Relations = z.object({});
export type Relations = z.infer<typeof Relations>;

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
  member: z.nullable(Member),
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
  parentId: z.nullable(z.string()),
});

export const ChannelUpdateOptions = z.object({
  name: z.nullable(z.string()),
});
