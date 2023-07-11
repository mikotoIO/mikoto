import { SophonInstance } from '@sophon-js/server';
import { NotFoundError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import {
  AbstractMemberService,
  AbstractUserService,
  MemberUpdateOptions,
  UserUpdateOptions,
} from './schema';

const memberInclude = {
  roles: {
    select: { id: true },
  },
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
      category: true,
    },
  },
};

export class MemberService extends AbstractMemberService {
  async get(ctx: SophonInstance, spaceId: string, userId: string) {
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
  }
  async update(
    ctx: SophonInstance,
    spaceId: string,
    userId: string,
    options: MemberUpdateOptions,
  ) {
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
  }
}

export class UserService extends AbstractUserService {
  async me(ctx: SophonInstance) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.data.user.sub },
    });
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  }
  async update(ctx: SophonInstance, options: UserUpdateOptions) {
    const user = await prisma.user.update({
      where: { id: ctx.data.user.sub },
      data: {
        name: options.name ?? undefined,
        avatar: options.avatar ?? undefined,
      },
    });
    return user;
  }
}
