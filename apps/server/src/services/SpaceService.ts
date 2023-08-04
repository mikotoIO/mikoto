import { permissions } from '@mikoto-io/permcheck';
import { Prisma } from '@prisma/client';
import { SophonCore, SophonInstance } from '@sophon-js/server';
import { ForbiddenError, NotFoundError } from 'routing-controllers';

import { logger } from '../functions/logger';
import {
  assertMembership,
  assertOwnership,
  assertPermission,
} from '../functions/permissions';
import { prisma } from '../functions/prisma';
import { serializeDates } from '../functions/serializeDate';
import {
  AbstractSpaceService,
  Invite,
  SophonContext,
  Space,
  SpaceServiceSender,
  SpaceUpdateOptions,
} from './schema';

const spaceInclude = {
  channels: true,
  roles: { orderBy: { position: 'desc' } },
} satisfies Prisma.SpaceInclude;

export class SpaceService extends AbstractSpaceService {
  async get(ctx: SophonInstance, id: string) {
    await assertMembership(ctx.data.user.sub, id);
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    return serializeDates(space);
  }

  async list(ctx: SophonInstance) {
    const list = await prisma.spaceUser.findMany({
      where: { userId: ctx.data.user.sub },
      include: {
        space: { include: spaceInclude },
      },
    });
    // TODO: move this to the init function when async inits are possible
    list.forEach((x) => ctx.join(`space/${x.space.id}`));
    return serializeDates(list.map((x) => x.space));
  }

  async create(ctx: SophonInstance, name: string) {
    logger.debug(`Creating space ${name}`);
    const space = await prisma.space.create({
      data: {
        name,
        channels: { create: [{ name: 'general', order: 0 }] },
        ownerId: ctx.data.user.sub,
        roles: {
          create: [{ name: '@everyone', position: -1, permissions: '0' }],
        },
      },
      include: spaceInclude,
    });
    await joinSpace(
      this.sophonCore,
      this.$,
      ctx.data.user.sub,
      serializeDates(space),
    );
    return serializeDates(space);
  }

  async update(ctx: SophonInstance, id: string, options: SpaceUpdateOptions) {
    assertPermission(ctx.data.user.sub, id, permissions.manageSpace);
    const space = await prisma.space.update({
      where: { id },
      data: {
        name: options.name ?? undefined,
        icon: options.icon ?? undefined,
      },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    this.$(`space/${id}`).onUpdate(serializeDates(space));
    return serializeDates(space);
  }

  async delete(ctx: SophonInstance, id: string) {
    assertOwnership(ctx.data.user.sub, id);
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    if (space.ownerId !== ctx.data.user.sub) {
      throw new ForbiddenError();
    }
    await prisma.space.delete({ where: { id } });
    await this.$(`space/${id}`).onDelete(serializeDates(space));
  }

  async join(ctx: SophonInstance, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: { roles: true, channels: true },
    });
    if (space === null) throw new NotFoundError();
    await joinSpace(
      this.sophonCore,
      this.$,
      ctx.data.user.sub,
      serializeDates(space),
    );
  }

  async leave(ctx: SophonInstance, id: string) {
    const space = await prisma.space.findUnique({
      where: { id },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError();
    await leaveSpace(
      this.sophonCore,
      this.$,
      ctx.data.user.sub,
      serializeDates(space),
    );
  }

  async createInvite(
    ctx: SophonInstance<SophonContext>,
    id: string,
  ): Promise<Invite> {
    const invite = await prisma.invite.create({
      data: {
        spaceId: id,
      },
    });
    return {
      code: invite.id,
    };
  }

  async listInvites(
    ctx: SophonInstance<SophonContext>,
    id: string,
  ): Promise<Invite[]> {
    const invites = await prisma.invite.findMany({
      where: { spaceId: id },
    });
    return invites.map((invite) => ({
      code: invite.id,
    }));
  }

  async deleteInvite(
    ctx: SophonInstance<SophonContext>,
    code: string,
  ): Promise<void> {
    await prisma.invite.delete({ where: { id: code } });
  }

  async addBot(
    ctx: SophonInstance<SophonContext>,
    spaceId: string,
    botId: string,
  ) {
    const bot = await prisma.user.findUnique({ where: { id: botId } });
    if (bot === null) throw new NotFoundError();
    if (bot.category !== 'BOT') throw new ForbiddenError();
    await prisma.spaceUser.create({
      data: { userId: botId, spaceId },
    });
  }
}

async function joinSpace(
  sophonCore: SophonCore<SophonContext>,
  $: (room: string) => SpaceServiceSender,
  userId: string,
  space: Space,
) {
  await prisma.spaceUser.create({
    data: {
      userId,
      spaceId: space.id,
    },
  });
  await sophonCore.joinAll(`user/${userId}`, `space/${space.id}`);

  $(`user/${userId}`).onCreate(space);
}

async function leaveSpace(
  sophonCore: SophonCore<SophonContext>,
  $: (room: string) => SpaceServiceSender,
  userId: string,
  space: Space,
) {
  await prisma.spaceUser.delete({
    where: { userId_spaceId: { userId, spaceId: space.id } },
  });
  await sophonCore.leaveAll(`user/${userId}`, `space/${space.id}`);

  $(`user/${userId}`).onDelete(space);
}
