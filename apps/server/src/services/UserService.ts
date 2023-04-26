import { NotFoundError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import { MemberService, UserService } from './schema';
import { sophon } from './sophon';

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

export const memberService = sophon.create(MemberService, {
  async get(ctx, spaceId, userId) {
    const member = await prisma.spaceUser.findUnique({
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
  },
  async update(ctx, spaceId, userId, options) {
    // TODO: probably a cleaner method to do this

    const roleIds = new Set(options.roleIds);
    const roles =
      (await prisma.spaceUser
        .findUnique({
          where: { userId_spaceId: { userId, spaceId } },
        })
        .roles()) ?? [];

    const oldRoleIds = new Set(roles.map((x) => x.id));
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
    return {
      roleIds: member.roles.map((x) => x.id),
      ...member,
    };
  },
});

export const userService = sophon.create(UserService, {
  async me(ctx) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.data.user.sub },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  },
});
