import { Prisma, Space } from '@prisma/client';

import * as m from '../models';

export const spaceInclude = {
  channels: true,
  roles: { orderBy: { position: 'desc' } },
} satisfies Prisma.SpaceInclude;
