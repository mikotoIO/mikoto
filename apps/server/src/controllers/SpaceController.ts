import { Get, JsonController, Param } from 'routing-controllers';
import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';

@JsonController()
@Service()
export class SpaceController {
  constructor(private prisma: PrismaClient) {}

  @Get('/hello')
  hello() {
    return {
      version: 'mikoto:DEVELOPMENT',
    };
  }

  @Get('/spaces/:id')
  async getOne(@Param('id') id: string) {
    return this.prisma.space.findUnique({ where: { id } });
  }

  @Get('/spaces/:spaceId/channels')
  async getChannels(@Param('spaceId') spaceId: string) {
    return this.prisma.channel.findMany({ where: { spaceId } });
  }
}
