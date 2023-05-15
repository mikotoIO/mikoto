import { NotFoundError } from 'routing-controllers';
import { prisma } from './prisma';

export const memberInclude = {
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

export async function findMember(spaceId: string, userId: string) {
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
