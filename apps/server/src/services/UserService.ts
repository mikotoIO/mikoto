import { permissions } from '@mikoto-io/permcheck';
import { SophonInstance } from '@sophon-js/server';
import { NotFoundError } from 'routing-controllers';

import { assertPermission } from '../functions/permissions';
import { prisma } from '../functions/prisma';
import { MikotoInstance } from './context';
import {
  AbstractMemberService,
  AbstractUserService,
  MemberUpdateOptions,
  SophonContext,
  UserUpdateOptions,
} from './schema';

export const memberInclude = {
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

  async list(ctx: SophonInstance, spaceId: string) {
    const members = await prisma.spaceUser.findMany({
      where: { spaceId },
      include: memberInclude,
    });
    return members.map((member) => {
      const { roles, ...rest } = member;
      return {
        roleIds: roles.map((x) => x.id),
        ...rest,
      };
    });
  }

  async update(
    ctx: MikotoInstance,
    spaceId: string,
    userId: string,
    options: MemberUpdateOptions,
  ) {
    // Compares the old roleIds with the new roleIds and connects/disconnects them
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

    const { roles, ...member } = await prisma.spaceUser.update({
      where: { userId_spaceId: { userId, spaceId } },
      data: {
        roles: {
          connect: roleIdsToCreate.map((x) => ({ id: x })),
          disconnect: roleIdsToDelete.map((x) => ({ id: x })),
        },
      },
      include: memberInclude,
    });

    const mappedMember = {
      roleIds: roles.map((x) => x.id),
      ...member,
    };

    ctx.data.pubsub.pub(`space:${spaceId}`, 'updateMember', mappedMember);
    return mappedMember;
  }

  // kick
  async delete(
    ctx: SophonInstance<SophonContext>,
    spaceId: string,
    userId: string,
  ): Promise<void> {
    assertPermission(ctx.data.user.sub, spaceId, permissions.ban);

    await prisma.spaceUser.delete({
      where: { userId_spaceId: { userId, spaceId } },
    });
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
  async update(ctx: MikotoInstance, options: UserUpdateOptions) {
    // TODO: Security issue. A third party image upload service can be used to upload unwanted tracking images.
    const user = await prisma.user.update({
      where: { id: ctx.data.user.sub },
      data: {
        name: options.name ?? undefined,
        avatar: options.avatar
          ? new URL(options.avatar).pathname.substring(1)
          : undefined,
      },
    });
    ctx.data.pubsub.pub(`user:${user.id}`, 'updateUser', user);
    return user;
  }
}
