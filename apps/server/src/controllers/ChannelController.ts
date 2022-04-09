import {Body, Delete, Get, JsonController, NotFoundError, Param, Post} from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { Service } from "typedi";

interface MessagePayload {
  content: string;
}

@JsonController()
@Service()
export class ChannelController {
  private prisma: PrismaClient;

  constructor(private io: Server) {
    this.prisma = new PrismaClient();
  }

  @Get("/channels/:id")
  async getOne(@Param("id") id: string) {
    return await this.prisma.channel
      .findUnique({ where: { id } });
  }

  @Get('/channels/:id/messages')
  async getMessages(@Param("id") channelId: string) {

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: { author: true },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return messages.reverse();
  }

  @Post("/channels/:id")
  async sendMessage(@Param("id") id: string, @Body() body: MessagePayload) {
    console.log(this.io)
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    const message = await this.prisma.message.create({
      data: {
        channelId: id,
        timestamp: new Date(),
        authorId: null,
        content: body.content
      }
    });
    this.io.in(channel.spaceId).emit('sendMessage', message);
    return message;
  }

  @Delete('/channels/:id/messages/:messageId')
  async deleteMessage(@Param("id") id: string, @Param("messageId") messageId: string) {
    // TODO: Permision checking
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (channel === null) throw new NotFoundError('ChannelNotFound');

    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    })
    await this.prisma.message.delete({
      where: { id: messageId }
    });
    this.io.in(channel.spaceId).emit('deleteMessage', message);
    return message;
  }
}
