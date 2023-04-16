import { ChannelType } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import { serializeDates } from '../functions/serializeDate';
import { ChannelService, MessageService } from './schema';
import { sophon } from './sophon';

const authorInclude = {
  select: {
    id: true,
    avatar: true,
    name: true,
  },
};

export const channelService = sophon.create(ChannelService, {
  async get(ctx, id: string) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError();
    return serializeDates(channel);
  },

  async list(ctx, spaceId: string) {
    const channels = await prisma.channel.findMany({ where: { spaceId } });
    return serializeDates(channels);
  },

  async create(ctx, spaceId, { name, type }) {
    const channelCount = await prisma.channel.count({
      where: { spaceId: spaceId },
    });
    const channel = await prisma.channel.create({
      data: {
        name,
        spaceId,
        type: type as ChannelType,
        order: channelCount,
      },
    });
    channelService.$(`space/${spaceId}`).onCreate(serializeDates(channel));
    return serializeDates(channel);
  },

  async delete(ctx, id: string) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError();
    await prisma.channel.delete({ where: { id } });
    channelService
      .$(`space/${channel.spaceId}`)
      .onDelete(serializeDates(channel));
    return;
  },

  async move(ctx, id: string, order) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError();
    if (channel.order === order) return;
    // if channel is moved up from x (8) to y (2), (x > y)
    // move previous y and everything under until x down by 1
    // y <= T < x

    // y >= T > x
    const updater = prisma.channel.update({
      where: { id: channel.id },
      data: { order },
    });
    if (channel.order > order) {
      await prisma.$transaction([
        prisma.channel.updateMany({
          where: {
            spaceId: channel.spaceId,
            order: { gte: order, lt: channel.order },
          },
          data: { order: { increment: 1 } },
        }),
        updater,
      ]);
    } else {
      await prisma.$transaction([
        prisma.channel.updateMany({
          where: {
            spaceId: channel.spaceId,
            order: { lte: order, gt: channel.order },
          },
          data: { order: { increment: -1 } },
        }),
        updater,
      ]);
    }
  },
});

export const messageService = sophon.create(MessageService, {
  async list(ctx, channelId: string, { cursor, limit }) {
    const messages = await prisma.message.findMany({
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

    return serializeDates(messages.reverse());
  },

  async send(ctx, channelId: string, content: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError('ChannelNotFound');
    const user = await prisma.spaceUser.findUnique({
      where: {
        userId_spaceId: { userId: ctx.data.user.sub, spaceId: channel.spaceId },
      },
    });
    if (user === null) {
      throw new UnauthorizedError('Not part of the space!');
    }

    const now = new Date();

    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          channelId,
          timestamp: now,
          authorId: ctx.data.user.sub,
          content,
        },
        include: { author: authorInclude },
      }),
      prisma.channel.update({
        where: { id: channelId },
        data: { lastUpdated: now },
      }),
    ]);

    messageService
      .$(`space/${channel.spaceId}`)
      .onCreate(serializeDates(message));
    return serializeDates(message);
  },

  async delete(ctx, channelId, messageId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (message === null) throw new NotFoundError('MessageNotFound');
    await prisma.message.delete({ where: { id: messageId } });

    messageService
      .$(`space/${channel.spaceId}`)
      .onDelete({ messageId, channelId });
    return;
  },
});
