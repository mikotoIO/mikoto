import {
  Body,
  Delete,
  Get,
  JsonController,
  NotFoundError,
  Param,
  Post,
} from 'routing-controllers';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { Service } from 'typedi';

interface MessagePayload {
  content: string;
}

interface ChannelPayload {
  spaceId: string;
  name: string;
}

@JsonController()
@Service()
export class ChannelController {
  constructor(private prisma: PrismaClient, private io: Server) {}

  @Post('/channels')
  async createChannel(@Body() body: ChannelPayload) {
    return this.prisma.channel.create({
      data: {
        name: body.name,
        spaceId: body.spaceId,
      },
    });
  }

  @Delete('/channels/:id')
  async deleteChannel(@Param('id') id: string) {
    return this.prisma.channel.delete({
      where: { id },
    });
  }

  @Get('/channels/:id')
  async getOne(@Param('id') id: string) {
    return this.prisma.channel.findUnique({ where: { id } });
  }

  @Get('/channels/:id/messages')
  async getMessages(@Param('id') channelId: string) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: { author: true },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return messages.reverse();
  }

  @Post('/channels/:id/messages')
  async sendMessage(@Param('id') id: string, @Body() body: MessagePayload) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    const message = await this.prisma.message.create({
      data: {
        channelId: id,
        timestamp: new Date(),
        authorId: null,
        content: body.content,
      },
    });
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
}
