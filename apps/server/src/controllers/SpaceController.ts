import { Get, JsonController, Param } from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@JsonController()
@Service()
export class SpaceController {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  @Get('/spaces/:id')
  async getOne(@Param('id') id: string) {
    return await this.prisma.space
      .findUnique({ where: { id } });
  }

  @Get('/spaces/:spaceId/channels')
  async getChannels(@Param('spaceId') spaceId: string) {
    return await this.prisma.channel
      .findMany({ where: { spaceId } });
  }
}
