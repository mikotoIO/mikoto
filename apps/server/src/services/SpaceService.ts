import { ForbiddenError, NotFoundError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import { serializeDates } from '../functions/serializeDate';
import { Space, SpaceService } from './schema';
import { sophon } from './sophon';

const spaceInclude = {
  channels: true,
  roles: true,
};

export const spaceService = sophon.create(SpaceService, {
  async get(ctx, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    return serializeDates(space);
  },

  async list(ctx) {
    const list = await prisma.spaceUser.findMany({
      where: { userId: ctx.data.user.sub },
      include: {
        space: { include: spaceInclude },
      },
    });
    // TODO: move this to the init function when async inits are possible
    list.forEach((x) => ctx.join(`space/${x.space.id}`));
    return serializeDates(list.map((x) => x.space));
  },

  async create(ctx, name) {
    const space = await prisma.space.create({
      data: {
        name: name,
        channels: { create: [{ name: 'general', order: 0 }] },
        ownerId: ctx.data.user.sub,
        roles: {
          create: [{ name: '@everyone', position: 0, permissions: '0' }],
        },
      },
      include: {
        channels: true,
        roles: true,
      },
    });
    await joinSpace(ctx.data.user.sub, serializeDates(space));
    return serializeDates(space);
  },

  async delete(ctx, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    if (space.ownerId !== ctx.data.user.sub) {
      throw new ForbiddenError();
    }
    await prisma.space.delete({ where: { id } });
    await spaceService.$(`space/${id}`).onDelete(serializeDates(space));
  },

  async join(ctx, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: { roles: true, channels: true },
    });
    if (space === null) throw new NotFoundError();
    await joinSpace(ctx.data.user.sub, serializeDates(space));
  },

  async leave(ctx, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    await leaveSpace(ctx.data.user.sub, serializeDates(space));
  },
});

async function joinSpace(userId: string, space: Space) {
  await prisma.spaceUser.create({
    data: { userId, spaceId: space.id },
  });
  await sophon.joinAll(`user/${userId}`, `space/${space.id}`);

  spaceService.$(`user/${userId}`).onCreate(space);
}

async function leaveSpace(userId: string, space: Space) {
  await prisma.spaceUser.delete({
    where: { userId_spaceId: { userId, spaceId: space.id } },
  });
  await sophon.leaveAll(`user/${userId}`, `space/${space.id}`);

  spaceService.$(`user/${userId}`).onDelete(space);
}
