import { Prisma } from '@prisma/client';

export const spaceInclude = {
  channels: true,
  roles: { orderBy: { position: 'desc' } },
} satisfies Prisma.SpaceInclude;

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
} satisfies Prisma.SpaceUserInclude;

export const authorInclude = {
  select: {
    id: true,
    avatar: true,
    name: true,
    category: true,
  },
};

export function memberMap<T extends { roles: { id: string }[] }>({
  roles,
  ...rest
}: T): Omit<T, 'roles'> & { roleIds: string[] } {
  return {
    ...rest,
    roleIds: roles.map((x) => x.id),
  };
}
