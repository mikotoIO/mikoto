import {
  Body,
  CurrentUser,
  Get,
  JsonController,
  Param,
  Post,
} from 'routing-controllers';
import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { AccountJwt } from '../auth';

interface SpaceCreationPayload {
  name: string;
}

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

  async join(userId: string, spaceId: string) {
    await this.prisma.spaceUser.create({
      data: { userId, spaceId },
    });
  }

  @Post('/join/:id/')
  async joinUser(@CurrentUser() user: AccountJwt, @Param('id') id: string) {
    await this.join(user.sub, id);
  }

  @Get('/spaces')
  async getList(@CurrentUser() jwt: AccountJwt) {
    const list = await this.prisma.spaceUser.findMany({
      where: { userId: jwt.sub },
      include: { space: true },
    });
    return list.map((x) => x.space);
  }

  @Get('/spaces/:id')
  async getOne(@Param('id') id: string) {
    return this.prisma.space.findUnique({ where: { id } });
  }

  @Post('/spaces')
  async create(
    @CurrentUser() jwt: AccountJwt,
    @Body() body: SpaceCreationPayload,
  ) {
    const space = await this.prisma.space.create({
      data: {
        name: body.name,
      },
    });
    await this.join(jwt.sub, space.id);
    return space;
  }

  @Get('/spaces/:spaceId/channels')
  async getChannels(@Param('spaceId') spaceId: string) {
    return this.prisma.channel.findMany({ where: { spaceId } });
  }
}
