import { PrismaClient, ChannelType } from '@prisma/client';
import {
  Body,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  NotFoundError,
  Param,
  Post,
  QueryParam,
  UnauthorizedError,
} from 'routing-controllers';
import { Server } from 'socket.io';
import { Service } from 'typedi';

import { AccountJwt } from '../auth';

interface MessagePayload {
  content: string;
}

interface ChannelPayload {
  spaceId: string;
  name: string;
  type: ChannelType;
}

const authorInclude = {
  select: {
    id: true,
    avatar: true,
    name: true,
  },
};

@JsonController()
@Service()
export class ChannelController {
  constructor(private prisma: PrismaClient, private io: Server) {}

  @Post('/channels')
  async createChannel(@Body() body: ChannelPayload) {
    const channelCount = await this.prisma.channel.count({
      where: { spaceId: body.spaceId },
    });
    const channel = await this.prisma.channel.create({
      data: {
        name: body.name,
        spaceId: body.spaceId,
        type: body.type,
        order: channelCount,
      },
    });
    this.io.in(channel.spaceId).emit('channelCreate', channel);
    return channel;
  }

  @Delete('/channels/:id')
  async deleteChannel(@Param('id') id: string) {
    const channel = await this.prisma.channel.delete({
      where: { id },
    });
    this.io.in(channel.spaceId).emit('channelDelete', channel);
    return channel;
  }

  @Get('/channels/:id')
  async getOne(@Param('id') id: string) {
    return this.prisma.channel.findUnique({ where: { id } });
  }

  @Get('/channels/:id/messages')
  async getMessages(
    @Param('id') channelId: string,
    @QueryParam('cursor') cursor?: string,
  ) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },

      include: { author: authorInclude },
      orderBy: { timestamp: 'desc' },
      take: 50,

      // cursor pagination
      ...(cursor !== undefined && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    });
    return messages.reverse();
  }

  @Post('/channels/:id/messages')
  async sendMessage(
    @CurrentUser() account: AccountJwt,
    @Param('id') id: string,
    @Body() body: MessagePayload,
  ) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError('ChannelNotFound');
    const user = await this.prisma.spaceUser.findUnique({
      where: {
        userId_spaceId: { userId: account.sub, spaceId: channel.spaceId },
      },
    });
    if (user === null) {
      throw new UnauthorizedError('Not part of the space!');
    }

    const now = new Date();

    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          channelId: id,
          timestamp: now,
          authorId: account.sub,
          content: body.content,
        },
        include: { author: authorInclude },
      }),
      this.prisma.channel.update({
        where: { id },
        data: { lastUpdated: now },
      }),
    ]);
    this.io.in(channel.spaceId).emit('messageCreate', message);
    return message;
  }

  @Delete('/channels/:id/messages/:messageId')
  async deleteMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    // TODO: Permision checking
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    await this.prisma.message.delete({
      where: { id: messageId },
    });
    this.io.in(channel.spaceId).emit('messageDelete', message);
    return message;
  }

  @Post('/channels/:channelId/move')
  async move(
    @CurrentUser() account: AccountJwt,
    @Param('channelId') channelId: string,
    @Body() body: { order: number },
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (channel === null) throw new NotFoundError();
    if (channel.order === body.order) return {};
    // if channel is moved up from x (8) to y (2), (x > y)
    // move previous y and everything under until x down by 1
    // y <= T < x

    // y >= T > x
    const updater = this.prisma.channel.update({
      where: { id: channel.id },
      data: { order: body.order },
    });
    if (channel.order > body.order) {
      await this.prisma.$transaction([
        this.prisma.channel.updateMany({
          where: {
            spaceId: channel.spaceId,
            order: { gte: body.order, lt: channel.order },
          },
          data: { order: { increment: 1 } },
        }),
        updater,
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.channel.updateMany({
          where: {
            spaceId: channel.spaceId,
            order: { lte: body.order, gt: channel.order },
          },
          data: { order: { increment: -1 } },
        }),
        updater,
      ]);
    }

    return {};
  }

  @Post('/channels/:channelId/ack')
  async ack(
    @CurrentUser() account: AccountJwt,
    @Param('channelId') channelId: string,
  ) {
    const now = new Date();
    await this.prisma.channelUnread.upsert({
      where: { channelId_userId: { channelId, userId: account.sub } },
      create: {
        channelId,
        userId: account.sub,
        timestamp: new Date(),
      },
      update: { timestamp: now },
    });
    return {};
  }
}
