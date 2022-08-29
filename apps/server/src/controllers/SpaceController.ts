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
  UploadedFile,
} from 'routing-controllers';
import { PrismaClient, Space } from '@prisma/client';
import { Service } from 'typedi';
import { Server } from 'socket.io';
import { Client } from 'minio';
import { AccountJwt } from '../auth';
import { uploadImage } from '../functions/uploadImage';

interface SpaceCreationPayload {
  name: string;
}

@JsonController()
@Service()
export class SpaceController {
  constructor(
    private prisma: PrismaClient,
    private io: Server,
    private minio: Client,
  ) {}

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

  async leave(userId: string, space: Space) {
    await this.prisma.spaceUser.delete({
      where: {
        userId_spaceId: {
          userId,
          spaceId: space.id,
        },
      },
    });
    const socketIds = await this.io.in(`user/${userId}`).allSockets();
    socketIds.forEach((socketId) => {
      this.io.sockets.sockets.get(socketId)?.leave(space.id);
    });

    this.io.to(`user/${userId}`).emit('spaceDelete', space);
  }

  @Post('/join/:id')
  async joinUser(@CurrentUser() user: AccountJwt, @Param('id') id: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (space === null) {
      throw new NotFoundError('Space cannot be found');
    }
    await this.join(user.sub, space);
    return {};
  }

  @Post('/leave/:spaceId')
  async leaveSpace(
    @CurrentUser() user: AccountJwt,
    @Param('spaceId') spaceId: string,
  ) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });
    if (space === null) {
      throw new NotFoundError();
    }
    await this.leave(user.sub, space);
    return {};
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
        channels: { create: [{ name: 'general', order: 0 }] },
        ownerId: jwt.sub,
        roles: {
          create: [{ name: '@everyone', position: 0, permissions: '0' }],
        },
      },
    });
    await this.join(jwt.sub, space);
    return space;
  }

  @Delete('/spaces/:id')
  async delete(@CurrentUser() account: AccountJwt, @Param('id') id: string) {
    // MUST BE A SPACE OWNER TO DELETE
    const spaceData = await this.prisma.space.findUnique({
      where: { id },
    });
    if (spaceData && spaceData.ownerId !== account.sub) {
      throw new UnauthorizedError('Only the owner may delete the space');
    }

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

  @Get('/spaces/:spaceId/unreads')
  async getUnreads(
    @CurrentUser() account: AccountJwt,
    @Param('spaceId') spaceId: string,
  ) {
    const channels = await this.prisma.channel.findMany({
      where: { spaceId },
      select: {
        channelUnread: {
          where: { userId: account.sub },
        },
      },
    });
    const unreads = channels.flatMap((x) => x.channelUnread);
    return Object.fromEntries(unreads.map((x) => [x.channelId, x.timestamp]));
  }

  @Get('/spaces/:spaceId/member')
  async getSpaceMembers(@Param('spaceId') spaceId: string) {
    return await this.prisma.spaceUser.findMany({
      where: {
        spaceId,
      },
    });
  }

  @Post('/spaces/:spaceId/icon')
  async uploadAvatar(
    @Param('spaceId') spaceId: string,
    @UploadedFile('avatar') icon: Express.Multer.File,
  ) {
    const uploaded = await uploadImage(this.minio, 'icon', icon);
    await this.prisma.space.update({
      where: { id: spaceId },
      data: { icon: uploaded.url },
    });

    return {
      status: 'ok',
    };
  }
}
