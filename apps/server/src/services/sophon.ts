import { SophonCore } from '@sophon-js/server/dist';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';
import { Server } from 'socket.io';

import { MainService } from '.';
import { env } from '../env';
import { prisma } from '../functions/prisma';
import { RedisPubSub } from '../functions/pubsub';
import { redis } from '../functions/redis';
import { Member, SophonContext } from './schema';

type PubSubEngine = {
  memberUpdate: Member;
};

declare module './schema' {
  interface SophonContext {
    user: { sub: string };
    pubsub: RedisPubSub<PubSubEngine>;
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
  async connect({ params, join }) {
    if (!params.accessToken) throw new UnauthorizedError('No Header');
    const user = jwt.verify(params.accessToken, env.SECRET) as any;

    join(`user/${user.sub}`);

    const spaces = await prisma.spaceUser
      .findMany({
        where: { userId: user.sub },
        include: {
          space: true,
        },
      })
      .then((xs) => xs.map((x) => x.space));

    const pubsub = new RedisPubSub<PubSubEngine>(redis);
    await pubsub.sub(spaces.map((x) => `space:${x.id}`));
    pubsub.on((x) => {
      // console.log(x);
    });

    return {
      pubsub,
      user,
    };
  },
  disconnect(data) {
    data.pubsub.close();
  },
});

const mainService = new MainService(sophon);

sophon.boot(mainService);

export function boot(port: number, cb: () => void) {
  httpServer.listen(port, cb);
}
