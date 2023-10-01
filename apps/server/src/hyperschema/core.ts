import { HyperRPC, UnauthorizedError } from '@hyperschema/core';

import { prisma } from '../functions/prisma';

export const h = new HyperRPC().context(async () => {
  const user = await prisma.user.findUnique({
    where: { id: '' },
  });
  if (user === null) throw new UnauthorizedError('Not logged in');
  return {
    $p: prisma,
    state: {
      user,
    },
  };
});

export type HSContext = Awaited<ReturnType<typeof h.contextFn>>
