import { NotFoundError, UnauthorizedError } from '@hyperschema/core';
import { z } from 'zod';

import { h } from '../core';
import { assertChannelMembership } from '../middlewares';
import { Message } from '../models';
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
    .fn(
      {
        channelId: z.string(),
        content: z.string(),
      },
      Message,
    )
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
});
