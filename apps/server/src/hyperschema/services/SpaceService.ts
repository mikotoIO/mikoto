import { NotFoundError } from '@hyperschema/core';
import { permissions } from '@mikoto-io/permcheck';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { prisma } from '../../functions/prisma';
import { HSContext, h } from '../core';
import { assertSpaceMembership, enforceSpacePerm } from '../middlewares';
import { Invite, Space, SpaceUpdateOptions } from '../models';
import { memberInclude, memberMap, spaceInclude } from '../normalizer';

export async function joinSpace(
  $r: HSContext['$r'],
  userId: string,
  space: Space,
) {
  const member = await prisma.spaceUser.create({
    data: {
      spaceId: space.id,
      userId,
    },
    include: memberInclude,
  });

  await $r.pub(`space:${space.id}`, 'createMember', memberMap(member));
  await $r.pub(`user:${userId}`, 'createSpace', space);
}

async function leaveSpace($r: HSContext['$r'], userId: string, space: Space) {
  const member = await prisma.spaceUser.delete({
    where: {
      userId_spaceId: { userId, spaceId: space.id },
    },
    include: memberInclude,
  });

  await $r.pub(`space:${space.id}`, 'deleteMember', memberMap(member));
  await $r.pub(`user:${userId}`, 'deleteSpace', space);
}

export const SpaceService = h.service({
  // gets a single Space.
  // must be a member of the space to fetch.
  get: h
    .fn({ spaceId: z.string() }, Space)
    .use(assertSpaceMembership)
    .do(async ({ spaceId }) => {
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      return space;
    }),

  list: h.fn({}, Space.array()).do(async ({ state }) => {
    const list = await prisma.spaceUser.findMany({
      where: { userId: state.user.id },
      include: {
        space: { include: spaceInclude },
      },
    });
    return list.map((x) => x.space);
  }),

  create: h.fn({ name: z.string() }, Space).do(async ({ name, $r, state }) => {
    const space = await prisma.space.create({
      data: {
        name,
        channels: { create: [{ name: 'general', order: 0 }] },
        ownerId: state.user.id,
        roles: {
          create: [{ name: '@everyone', position: -1, permissions: '0' }],
        },
      },
      include: spaceInclude,
    });
    joinSpace($r, state.user.id, Space.parse(space));
    return space;
  }),

  update: h
    .fn({ spaceId: z.string(), options: SpaceUpdateOptions }, Space)
    .use(enforceSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId, options, $r }) => {
      const space = await prisma.space.update({
        where: { id: spaceId },
        data: {
          name: options.name ?? undefined,
          icon: options.icon
            ? new URL(options.icon).pathname.substring(1)
            : undefined,
        },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      $r.pub(`space:${spaceId}`, 'updateSpace', space);
      return space;
    }),

  delete: h
    .fn({ spaceId: z.string() }, Space)
    .use(enforceSpacePerm(permissions.superuser))
    .do(async ({ spaceId, $r }) => {
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      await prisma.space.delete({ where: { id: spaceId } });
      await $r.pub(`space:${spaceId}`, 'deleteSpace', space);
      return space;
    }),

  onCreate: h.event(Space).emitter((emit, { $r }) => {
    $r.on('createSpace', (space) => {
      $r.sub(`space:${space.id}`);
      emit(space);
    });
  }),

  onUpdate: h.event(Space).emitter((emit, { $r }) => {
    $r.on('updateSpace', emit);
  }),

  onDelete: h.event(Space).emitter((emit, { $r }) => {
    $r.on('deleteSpace', (space) => {
      $r.unsub(`space:${space.id}`);
      emit(space);
    });
  }),

  getSpaceFromInvite: h
    .fn({ inviteCode: z.string() }, Space)
    .do(async ({ inviteCode }) => {
      const invite = await prisma.invite.findUnique({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();

      const space = await prisma.space.findUnique({
        where: { id: invite?.spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();

      return space;
    }),

  join: h
    .fn({ inviteCode: z.string() }, Space)
    .do(async ({ inviteCode, $r, state }) => {
      const invite = await prisma.invite.findUnique({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();

      const space = await prisma.space.findUnique({
        where: { id: invite?.spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();

      await joinSpace($r, state.user.id, Space.parse(space));
      return space;
    }),

  leave: h
    .fn({ spaceId: z.string() }, Space)
    .use(assertSpaceMembership)
    .do(async ({ spaceId, $r, state }) => {
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      await leaveSpace($r, state.user.id, Space.parse(space));
      return space;
    }),

  // invite management
  createInvite: h
    .fn({ spaceId: z.string() }, Invite)
    .use(enforceSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId, state }) => {
      const invite = await prisma.invite.create({
        data: {
          id: nanoid(12),
          spaceId,
          creatorId: state.user.id,
        },
      });
      return { code: invite.id };
    }),

  listInvites: h
    .fn({ spaceId: z.string() }, Invite.array())
    .use(enforceSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId }) => {
      const invites = await prisma.invite.findMany({
        where: { spaceId },
      });
      return invites.map((x) => ({ code: x.id }));
    }),

  deleteInvite: h
    .fn({ spaceId: z.string(), inviteCode: z.string() }, z.string())
    .use(enforceSpacePerm(permissions.manageSpace))
    .do(async ({ inviteCode }) => {
      const invite = await prisma.invite.delete({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();
      return invite.id;
    }),
});
