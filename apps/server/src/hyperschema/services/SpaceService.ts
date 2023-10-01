import { NotFoundError, UnauthorizedError } from '@hyperschema/core';
import { z } from 'zod';

import { HSContext, h } from '../core';
import { Space } from '../models';
import { spaceInclude } from '../normalizer';

async function assertSpaceMembership<T extends HSContext & { spaceId: string }>(
  props: T,
): Promise<T> {
  const membership = await props.$p.spaceUser.findUnique({
    where: {
      userId_spaceId: {
        userId: props.state.user.id,
        spaceId: props.spaceId,
      },
    },
  });
  if (membership === null) throw new UnauthorizedError('Not a member of space');
  return props;
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

  list: h.fn({}, z.array(Space)).do(async ({ $p, state }) => {
    const list = await $p.spaceUser.findMany({
      where: { userId: state.user.id },
      include: {
        space: { include: spaceInclude },
      },
    });
    return list.map((x) => x.space);
  }),

  create: h.fn({ name: z.string() }, Space).do(async ({ name, $p, state }) => {
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
    return space;
  }),
});
