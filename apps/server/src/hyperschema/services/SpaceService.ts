import { NotFoundError } from '@hyperschema/core';
import { permissions } from '@mikoto-io/permcheck';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { HSContext, h } from '../core';
import { assertSpaceMembership, requireSpacePerm } from '../middlewares';
import { Invite, Space, SpaceUpdateOptions } from '../models';
import { memberInclude, memberMap, spaceInclude } from '../normalizer';

async function joinSpace(
  $p: HSContext['$p'],
  $r: HSContext['$r'],
  userId: string,
  space: Space,
) {
  const member = await $p.spaceUser.create({
    data: {
      spaceId: space.id,
      userId,
    },
    include: memberInclude,
  });

  await $r.pub(`user:${userId}`, 'createMember', memberMap(member));
  await $r.pub(`space:${space.id}`, 'createSpace', space);
}

async function leaveSpace(
  $p: HSContext['$p'],
  $r: HSContext['$r'],
  userId: string,
  space: Space,
) {
  const member = await $p.spaceUser.delete({
    where: {
      userId_spaceId: { userId, spaceId: space.id },
    },
    include: memberInclude,
  });

  await $r.pub(`user:${userId}`, 'deleteMember', memberMap(member));
  await $r.pub(`space:${space.id}`, 'deleteSpace', space);
}

export const SpaceService = h.service({
  // gets a single Space.
  // must be a member of the space to fetch.
  get: h
    .fn({ spaceId: z.string() }, Space)
    .use(assertSpaceMembership)
    .do(async ({ spaceId, $p }) => {
      const space = await $p.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      return space;
    }),

  list: h.fn({}, Space.array()).do(async ({ $p, state }) => {
    const list = await $p.spaceUser.findMany({
      where: { userId: state.user.id },
      include: {
        space: { include: spaceInclude },
      },
    });
    return list.map((x) => x.space);
  }),

  create: h
    .fn({ name: z.string() }, Space)
    .do(async ({ name, $p, $r, state }) => {
      const space = await $p.space.create({
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
      await $p.spaceUser.create({
        data: {
          spaceId: space.id,
          userId: state.user.id,
        },
      });
      joinSpace($p, $r, state.user.id, Space.parse(space));
      return space;
    }),

  update: h
    .fn({ spaceId: z.string(), options: SpaceUpdateOptions }, Space)
    .use(requireSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId, options, $p, $r }) => {
      const space = await $p.space.update({
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
    .use(requireSpacePerm(permissions.superuser))
    .do(async ({ spaceId, $p, $r }) => {
      const space = await $p.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      await $p.space.delete({ where: { id: spaceId } });
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
    .do(async ({ inviteCode, $p }) => {
      const invite = await $p.invite.findUnique({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();

      const space = await $p.space.findUnique({
        where: { id: invite?.spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();

      return space;
    }),

  join: h
    .fn({ inviteCode: z.string() }, Space)
    .do(async ({ inviteCode, $p, $r, state }) => {
      const invite = await $p.invite.findUnique({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();

      const space = await $p.space.findUnique({
        where: { id: invite?.spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();

      await joinSpace($p, $r, state.user.id, Space.parse(space));
      return space;
    }),

  leave: h
    .fn({ spaceId: z.string() }, Space)
    .use(assertSpaceMembership)
    .do(async ({ spaceId, $p, $r, state }) => {
      const space = await $p.space.findUnique({
        where: { id: spaceId },
        include: spaceInclude,
      });
      if (space === null) throw new NotFoundError();
      await leaveSpace($p, $r, state.user.id, Space.parse(space));
      return space;
    }),

  // invite management
  createInvite: h
    .fn({ spaceId: z.string() }, Invite)
    .use(requireSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId, $p, state }) => {
      const invite = await $p.invite.create({
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
    .use(requireSpacePerm(permissions.manageSpace))
    .do(async ({ spaceId, $p }) => {
      const invites = await $p.invite.findMany({
        where: { spaceId },
      });
      return invites.map((x) => ({ code: x.id }));
    }),

  deleteInvite: h
    .fn({ spaceId: z.string(), inviteCode: z.string() }, z.string())
    .use(requireSpacePerm(permissions.manageSpace))
    .do(async ({ inviteCode, $p }) => {
      const invite = await $p.invite.delete({
        where: { id: inviteCode },
      });
      if (invite === null) throw new NotFoundError();
      return invite.id;
    }),
});
