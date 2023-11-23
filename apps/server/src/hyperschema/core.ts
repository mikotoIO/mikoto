import { HyperRPC, UnauthorizedError } from '@hyperschema/core';
import jwt from 'jsonwebtoken';

import { env } from '../env';
import { prisma } from '../functions/prisma';
import { PubSubSystem } from '../functions/pubsubSystem';
import { redis } from '../functions/redis';
import { emitterModel } from './models/emitter';

export const h = new HyperRPC().context(async ({ $meta }) => {
  const j = jwt.verify($meta.authToken ?? '', env.SECRET) as any;
  const user = await prisma.user.findUnique({
    where: { id: j.sub },
  });

  if (user === null) throw new UnauthorizedError('Not logged in');
  const spaces = await prisma.spaceUser
    .findMany({
      where: { userId: user.id },
      include: {
        space: true,
      },
    })
    .then((xs) => xs.map((x) => x.space));

  const $r = new PubSubSystem(redis, emitterModel);
  const toSub = [`user:${user.id}`, ...spaces.map((x) => `space:${x.id}`)];
  if (toSub.length > 0) {
    await $r.sub(toSub);
  }
  return {
    $r,
    state: {
      user,
    },
  };
});

export type HSContext = Awaited<ReturnType<typeof h.contextFn>>;
