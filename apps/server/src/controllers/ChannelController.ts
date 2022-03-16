import { Body, Get, JsonController, Param, Post } from "routing-controllers";
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

  constructor(
    private io: Server
  ) {
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

    return await this.prisma.message.create({
      data: {
        channelId: id,
        timestamp: new Date(),
        authorId: null,
        content: body.content
      }
    });
  }
}
