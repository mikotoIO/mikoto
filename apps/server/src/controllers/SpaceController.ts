import { PrismaClient, Space } from '@prisma/client';
import {
  Body,
  CurrentUser,
  Delete,
  Get,
  JsonController,
  NotFoundError,
  Param,
  Patch,
  Post,
  UnauthorizedError,
  UploadedFile,
} from 'routing-controllers';
import { Server } from 'socket.io';
import { Service } from 'typedi';

import { AccountJwt } from '../auth';
import Minio from '../functions/Minio';

interface SpaceCreationPayload {
  name: string;
}

const memberInclude = {
  roles: {
    select: { id: true },
  },
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
};

@JsonController()
@Service()
export class SpaceController {
  constructor(
    private prisma: PrismaClient,
    private io: Server,
    private minio: Minio,
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
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { roles: true, channels: true },
    });
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
      include: {
        space: {
          include: {
            channels: true,
            roles: true,
          },
        },
      },
    });
    return list.map((x) => x.space);
  }

  @Get('/spaces/:id')
  async getOne(@Param('id') id: string) {
    return this.prisma.space.findUnique({
      where: { id },
      include: {
        channels: true,
        roles: true,
      },
    });
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
      include: {
        channels: true,
        roles: true,
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

  @Get('/spaces/:spaceId/members')
  async getSpaceMembers(@Param('spaceId') spaceId: string) {
    const members = await this.prisma.spaceUser.findMany({
      where: {
        spaceId,
      },
      include: memberInclude,
    });

    return members.map(({ roles, ...rest }) => ({
      roleIds: roles.map((x) => x.id),
      ...rest,
    }));
  }

  @Get('/spaces/:spaceId/members/:userId')
  async getSpaceMember(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
  ) {
    const member = await this.prisma.spaceUser.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
      include: memberInclude,
    });
    if (!member) {
      throw new NotFoundError();
    }
    const { roles, ...rest } = member;
    return {
      roleIds: roles.map((x) => x.id),
      ...rest,
    };
  }

  @Patch('/spaces/:spaceId/members/:userId')
  async updateSpaceMember(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Body()
    body: {
      roleIds?: string[];
    },
  ) {
    // todo: probably a cleaner method to do this

    const roleIds = new Set(body.roleIds);
    const roles =
      (await this.prisma.spaceUser
        .findUnique({
          where: { userId_spaceId: { userId, spaceId } },
        })
        .roles()) ?? [];

    const oldRoleIds = new Set(roles.map((x) => x.id));
    const roleIdsToCreate = [...roleIds].filter((x) => !oldRoleIds.has(x));
    const roleIdsToDelete = [...oldRoleIds].filter((x) => !roleIds.has(x));

    const member = await this.prisma.spaceUser.update({
      where: { userId_spaceId: { userId, spaceId } },
      data: {
        roles: {
          connect: roleIdsToCreate.map((x) => ({ id: x })),
          disconnect: roleIdsToDelete.map((x) => ({ id: x })),
        },
      },
      include: memberInclude,
    });
    return {
      roleIds: member.roles.map((x) => x.id),
      ...member,
    };
  }

  @Post('/spaces/:spaceId/icon')
  async uploadAvatar(
    @Param('spaceId') spaceId: string,
    @UploadedFile('avatar') icon: Express.Multer.File,
  ) {
    const uploaded = await this.minio.uploadImage('icon', icon);
    await this.prisma.space.update({
      where: { id: spaceId },
      data: { icon: uploaded.url },
    });

    return {
      status: 'ok',
    };
  }
}
