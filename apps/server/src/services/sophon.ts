import { SophonCore } from '@sophon-js/server/dist';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';
import { Server } from 'socket.io';

import { MainService } from '.';
import { env } from '../env';
import { SophonContext } from './schema';

declare module './schema' {
  interface SophonContext {
    user: { sub: string };
  }
}

const healthCheckApp = express();
healthCheckApp.get('/', (req, res) => {
  res.json({ name: 'Mikoto' });
});

const httpServer = createServer(healthCheckApp);

const sophonIO = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

export const sophon = new SophonCore<SophonContext>(sophonIO, {
  connect: ({ params, join }) => {
    if (!params.accessToken) throw new UnauthorizedError('No Header');
    const user = jwt.verify(params.accessToken, env.SECRET) as any;
    join(`user/${user.sub}`);
    return {
      user,
    };
  },
});

const mainService = new MainService(sophon);

sophon.boot(mainService);

export function boot(port: number, cb: () => void) {
  httpServer.listen(port, cb);
}
