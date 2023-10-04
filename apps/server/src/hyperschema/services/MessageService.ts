import { NotFoundError, UnauthorizedError } from '@hyperschema/core';
import { z } from 'zod';

import { h } from '../core';
import { assertChannelMembership } from '../middlewares';
import { Message, TypingEvent, Unread } from '../models';
import { emitterModel } from '../models/emitter';
import { authorInclude } from '../normalizer';

export const MessageService = h.service({
  list: h
    .fn(
      {
        channelId: z.string(),
        cursor: z.string().nullable(),
        limit: z.number().int(),
      },
      Message.array(),
    )
    .use(assertChannelMembership)
    .do(async ({ channelId, cursor, limit, $p }) => {
      const messages = await $p.message.findMany({
        where: { channelId },

        include: { author: authorInclude },
        orderBy: { timestamp: 'desc' },
        take: limit,
        // cursor pagination
        ...(cursor !== null && {
          skip: 1,
          cursor: {
            id: cursor,
          },
        }),
      });
      return messages.reverse();
    }),

  send: h
    .fn({ channelId: z.string(), content: z.string() }, Message)
    .use(assertChannelMembership)
    .do(async ({ $p, $r, channelId, content, state }) => {
      const channel = await $p.channel.findUnique({
        where: { id: channelId },
      });
      if (channel === null) throw new NotFoundError('ChannelNotFound');

      const now = new Date();

      const [message] = await Promise.all([
        $p.message.create({
          data: {
            channelId,
            timestamp: now,
            authorId: state.user.id,
            content,
          },
          include: { author: authorInclude },
        }),
        $p.channel.update({
          where: { id: channelId },
          data: { lastUpdated: now },
        }),
      ]);
      await $r.pub(`space:${channel.spaceId}`, 'createMessage', message);
      return message;
    }),

  edit: h
    .fn(
      {
        channelId: z.string(),
        messageId: z.string(),
        content: z.string(),
      },
      Message,
    )
    .use(assertChannelMembership)
    .do(async ({ $p, $r, state, channel, messageId, content }) => {
      const message = await $p.message.findUnique({
        where: { id: messageId },
      });
      if (message === null) throw new NotFoundError('MessageNotFound');
      if (message.authorId !== state.user.id) throw new UnauthorizedError();
      const newMessage = await $p.message.update({
        where: { id: messageId },
        data: { content, editedTimestamp: new Date() },
        include: { author: authorInclude },
      });
      await $r.pub(`space:${channel.spaceId}`, 'updateMessage', newMessage);
      return newMessage;
    }),

  delete: h
    .fn({ channelId: z.string(), messageId: z.string() }, Message)
    .use(assertChannelMembership)
    .do(async ({ $p, $r, state, channel, messageId }) => {
      const message = await $p.message.findUnique({
        where: { id: messageId },
        include: { author: authorInclude },
      });
      if (message === null) throw new NotFoundError('MessageNotFound');
      if (message.authorId !== state.user.id) throw new UnauthorizedError();
      await $p.message.delete({
        where: { id: messageId },
      });
      await $r.pub(`space:${channel.spaceId}`, 'deleteMessage', message);
      return message;
    }),

  onCreate: h.event(Message).emitter((emit, { $r }) => {
    $r.on('createMessage', emit);

    return () => {
      $r.close();
    };
  }),

  onUpdate: h.event(Message).emitter((emit, { $r }) => {
    $r.on('updateMessage', emit);
  }),

  onDelete: h.event(Message).emitter((emit, { $r }) => {
    $r.on('deleteMessage', emit);
  }),

  // typing-related logics
  startTyping: h
    .fn({ channelId: z.string() }, TypingEvent)
    .use(assertChannelMembership)
    .do(async ({ $r, channel, member }) => {
      const evt: TypingEvent = {
        channelId: channel.id,
        userId: member.userId,
        memberId: member.id,
      };
      await $r.pub(`space:${channel.spaceId}`, 'startTyping', evt);
      return evt;
    }),

  onTypingStart: h.event(TypingEvent).emitter((emit, { $r }) => {
    $r.on('startTyping', emit);
  }),

  ack: h
    .fn({ channelId: z.string(), timestamp: z.string() }, Unread)
    // .use(assertChannelMembership)
    .do(async ({ $p, state, channelId, timestamp }) => {
      const unread = await $p.channelUnread.upsert({
        create: {
          channelId,
          userId: state.user.id,
          timestamp: new Date(timestamp),
        },
        update: {
          timestamp: new Date(timestamp),
        },
        where: {
          channelId_userId: {
            channelId,
            userId: state.user.id,
          },
        },
      });
      return {
        channelId: unread.channelId,
        timestamp: unread.timestamp.toISOString(),
      };
    }),

  listUnread: h
    .fn({ spaceId: z.string() }, Unread.array())
    .do(async ({ $p, state, spaceId }) => {
      const unreads = await $p.channelUnread.findMany({
        where: { userId: state.user.id, channel: { spaceId } },
      });
      return unreads.map((u) => ({
        channelId: u.channelId,
        timestamp: u.timestamp.toISOString(),
      }));
    }),
});
