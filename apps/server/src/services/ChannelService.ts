import { permissions } from '@mikoto-io/permcheck';
import { ChannelType } from '@prisma/client';
import { SophonInstance } from '@sophon-js/server';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';

import { findMember } from '../functions/includes';
import { assertMembership, assertPermission } from '../functions/permissions';
import { prisma } from '../functions/prisma';
import { serializeDates } from '../functions/serializeDate';
import {
  AbstractChannelService,
  AbstractMessageService,
  ChannelCreateOptions,
  SophonContext,
} from './schema';

const authorInclude = {
  select: {
    id: true,
    avatar: true,
    name: true,
    category: true,
  },
};

export class ChannelService extends AbstractChannelService {
  async get(ctx: SophonInstance, id: string) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError();
    return serializeDates(channel);
  }

  // list: async (ctx, spaceId: string) => {
  async list(ctx: SophonInstance, spaceId: string) {
    const channels = await prisma.channel.findMany({ where: { spaceId } });
    return serializeDates(channels);
  }

  // create: async (ctx, spaceId, { name, type, parentId }) => {
  async create(
    ctx: SophonInstance,
    spaceId: string,
    { name, type, parentId }: ChannelCreateOptions,
  ) {
    const channelCount = await prisma.channel.count({
      where: { spaceId },
    });
    const channel = await prisma.channel.create({
      data: {
        name,
        spaceId,
        parentId,
        type: type as ChannelType,
        order: channelCount,
      },
    });
    this.$(`space/${spaceId}`).onCreate(serializeDates(channel));
    return serializeDates(channel);
  }

  async delete(ctx: SophonInstance, id: string) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError();
    await prisma.channel.delete({ where: { id } });
    this.$(`space/${channel.spaceId}`).onDelete(serializeDates(channel));
  }

  async move(ctx: SophonInstance, id: string, order: number) {
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
  }

  async startTyping(ctx: SophonInstance, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError();
    const member = await findMember(channel.spaceId, ctx.data.user.sub);

    this.$(`space/${channel.spaceId}`).onTypingStart({
      channelId,
      userId: ctx.data.user.sub,
      member: serializeDates(member),
    });
  }

  async stopTyping() {
    throw new Error('not implemented');
  }
}

export class MessageService extends AbstractMessageService {
  async list(
    ctx: SophonInstance,
    channelId: string,
    { cursor, limit }: { cursor: string | null; limit: number },
  ) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    await assertMembership(ctx.data.user.sub, channel.spaceId);
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
  }

  async send(ctx: SophonInstance, channelId: string, content: string) {
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

    this.$(`space/${channel.spaceId}`).onCreate(serializeDates(message));
    return serializeDates(message);
  }

  async delete(ctx: SophonInstance, channelId: string, messageId: string) {
    // TODO: Fine-grained permission checking for channels
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError('ChannelNotFound');
    await assertPermission(
      ctx.data.user.sub,
      channel.spaceId,
      permissions.manageChannels,
    );

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (message === null) throw new NotFoundError('MessageNotFound');
    await prisma.message.delete({ where: { id: messageId } });

    this.$(`space/${channel.spaceId}`).onDelete({ messageId, channelId });
  }

  async ack(
    ctx: SophonInstance<SophonContext>,
    channelId: string,
    timestamp: string,
  ) {
    await prisma.channelUnread.upsert({
      create: {
        channelId,
        userId: ctx.data.user.sub,
        timestamp: new Date(timestamp),
      },
      update: {
        timestamp: new Date(timestamp),
      },
      where: {
        channelId_userId: {
          channelId,
          userId: ctx.data.user.sub,
        },
      },
    });
  }
}
