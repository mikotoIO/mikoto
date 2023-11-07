import { NotFoundError } from '@hyperschema/core';
import { permissions } from '@mikoto-io/permcheck';
import { z } from 'zod';

import { prisma } from '../../functions/prisma';
import { h } from '../core';
import { assertSpaceMembership, requireSpacePerm } from '../middlewares';
import { Member } from '../models';
import { memberInclude, memberMap } from '../normalizer';

export const MemberUpdateOptions = z.object({
  roleIds: z.array(z.string()),
});

export const MemberService = h.service({
  get: h
    .fn({ spaceId: z.string(), userId: z.string() }, Member)
    .use(assertSpaceMembership)
    .do(async ({ spaceId, userId }) => {
      const member = await prisma.spaceUser.findUnique({
        where: { userId_spaceId: { userId, spaceId } },
        include: memberInclude,
      });
      if (!member) throw new NotFoundError();
      return memberMap(member);
    }),

  // only works for bot users

  list: h
    .fn({ spaceId: z.string() }, Member.array())
    .use(assertSpaceMembership)
    .do(async ({ spaceId }) => {
      const members = await prisma.spaceUser.findMany({
        where: { spaceId },
        include: memberInclude,
      });
      return members.map(memberMap);
    }),

  create: h
    .fn({ spaceId: z.string(), userId: z.string() }, Member)
    .use(assertSpaceMembership)
    .do(async ({ $r, spaceId, userId }) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new NotFoundError();
      if (user.category !== 'BOT') throw new NotFoundError('User is not a bot');

      const member = await prisma.spaceUser.create({
        data: {
          userId,
          spaceId,
        },
        include: memberInclude,
      });

      await $r.pub(`space:${spaceId}`, 'createMember', memberMap(member));
      return memberMap(member);
    }),

  update: h
    .fn(
      { spaceId: z.string(), userId: z.string(), options: MemberUpdateOptions },
      Member,
    )
    .use(requireSpacePerm(permissions.manageRoles))
    .do(async ({ $r, spaceId, userId, options }) => {
      // TODO: probably a cleaner method to do this

      const roleIds = new Set(options.roleIds);
      const rolesList =
        (await prisma.spaceUser
          .findUnique({
            where: { userId_spaceId: { userId, spaceId } },
          })
          .roles()) ?? [];

      const oldRoleIds = new Set(rolesList.map((x) => x.id));
      const roleIdsToCreate = [...roleIds].filter((x) => !oldRoleIds.has(x));
      const roleIdsToDelete = [...oldRoleIds].filter((x) => !roleIds.has(x));
      const member = await prisma.spaceUser.update({
        where: { userId_spaceId: { userId, spaceId } },
        data: {
          roles: {
            connect: roleIdsToCreate.map((x) => ({ id: x })),
            disconnect: roleIdsToDelete.map((x) => ({ id: x })),
          },
        },
        include: memberInclude,
      });

      await $r.pub(`space:${spaceId}`, 'updateMember', memberMap(member));
      return memberMap(member);
    }),

  delete: h
    .fn({ spaceId: z.string(), userId: z.string() }, Member)
    .use(requireSpacePerm(permissions.ban))
    .do(async ({ $r, spaceId, userId }) => {
      const member = await prisma.spaceUser.delete({
        where: {
          userId_spaceId: { userId, spaceId },
        },
        include: memberInclude,
      });

      await $r.pub(`space:${spaceId}`, 'deleteMember', memberMap(member));
      return memberMap(member);
    }),

  onCreate: h.event(Member).emitter((emit, { $r }) => {
    $r.on('createMember', emit);
  }),

  onUpdate: h.event(Member).emitter((emit, { $r }) => {
    $r.on('updateMember', emit);
  }),

  onDelete: h.event(Member).emitter((emit, { $r }) => {
    $r.on('deleteMember', emit);
  }),
});
