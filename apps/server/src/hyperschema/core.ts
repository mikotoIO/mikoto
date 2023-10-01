import { HyperRPC, UnauthorizedError } from '@hyperschema/core';

import { prisma } from '../functions/prisma';
import { PubSubSystem } from '../functions/pubsubSystem';
import { redis } from '../functions/redis';
import { emitterModel } from './models/emitter';

export const h = new HyperRPC().context(async () => {
  // const j = jwt.verify(params.accessToken, env.SECRET) as any;
  const user = await prisma.user.findUnique({
    where: { id: '' },
  });
  if (user === null) throw new UnauthorizedError('Not logged in');
  return {
    $p: prisma,
  $r: new PubSubSystem(redis, emitterModel),
    state: {
      user,
    },
  };
});

export type HSContext = Awaited<ReturnType<typeof h.contextFn>>;
