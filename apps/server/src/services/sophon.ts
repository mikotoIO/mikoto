import { SophonRouter } from '@sophon-js/server/dist';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';

import { MainService, SophonContext } from './schema';

declare module './schema' {
  interface SophonContext {
    user: { sub: string };
  }
}

export const sophon = new SophonRouter<SophonContext>({
  connect: ({ params, join }) => {
    if (!params.accessToken) throw new UnauthorizedError('No Header');
    const user = jwt.verify(params.accessToken, process.env.SECRET!) as any;
    join(`user/${user.sub}`);
    return {
      user,
    };
  },
});
