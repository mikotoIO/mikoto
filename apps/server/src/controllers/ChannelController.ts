import {
  Body,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  NotFoundError,
  Param,
  Post,
  UnauthorizedError,
} from 'routing-controllers';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { Service } from 'typedi';
import { AccountJwt } from '../auth';

interface MessagePayload {
  content: string;
}

interface ChannelPayload {
  spaceId: string;
  name: string;
}

const authorInclude = {
  select: {
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
    const channel = await this.prisma.channel.create({
      data: {
        name: body.name,
        spaceId: body.spaceId,
        order: 0,
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
  async getMessages(@Param('id') channelId: string) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: { author: authorInclude },
      orderBy: { timestamp: 'desc' },
      take: 50,
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

  @Post('/channels/:channelId/ack')
  async ack(
    @CurrentUser() account: AccountJwt,
    @Param('channelId') channelId: string,
  ) {
    const now = new Date();
    this.prisma.channelUnread.upsert({
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
