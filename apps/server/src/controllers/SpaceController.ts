import {
  Body,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  NotFoundError,
  Param,
  Post,
} from 'routing-controllers';
import { PrismaClient, Space } from '@prisma/client';
import { Service } from 'typedi';
import { Server } from 'socket.io';
import { AccountJwt } from '../auth';

interface SpaceCreationPayload {
  name: string;
}

@JsonController()
@Service()
export class SpaceController {
  constructor(private prisma: PrismaClient, private io: Server) {}

  @Get('/hello')
  hello() {
    return {
      version: 'mikoto:DEVELOPMENT',
    };
  }

  async join(userId: string, space: Space) {
    await this.prisma.spaceUser.create({
      data: { userId, spaceId: space.id },
    });
    const socketIds = await this.io.in(`user/${userId}`).allSockets();
    socketIds.forEach((socketId) => {
      this.io.sockets.sockets.get(socketId)?.join(space.id);
    });

    this.io.to(`user/${userId}`).emit('spaceCreate', space);
  }

  @Post('/join/:id')
  async joinUser(@CurrentUser() user: AccountJwt, @Param('id') id: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (space === null) {
      throw new NotFoundError();
    }
    return this.join(user.sub, space);
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
      data: { name: body.name },
    });
    await this.join(jwt.sub, space);
    return space;
  }

  @Delete('/spaces/:id')
  async delete(
    @Param('id') id: string,
    // @CurrentUser() jwt: AccountJwt,
  ) {
    const space = await this.prisma.space.delete({
      where: { id },
    });
    this.io.to(space.id).emit('spaceDelete', space);
    return space;
  }

  @Get('/spaces/:spaceId/channels')
  async getChannels(@Param('spaceId') spaceId: string) {
    return this.prisma.channel.findMany({ where: { spaceId } });
  }
}
