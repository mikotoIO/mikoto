import { SophonRouter } from '@sophon-js/server/dist';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';

import { SophonContext } from './schema';
import { env } from '../env';

declare module './schema' {
  interface SophonContext {
    user: { sub: string };
  }
}

export const sophon = new SophonRouter<SophonContext>({
  connect: ({ params, join }) => {
    if (!params.accessToken) throw new UnauthorizedError('No Header');
    const user = jwt.verify(params.accessToken, env.SECRET) as any;
    join(`user/${user.sub}`);
    return {
      user,
    };
  },
});
