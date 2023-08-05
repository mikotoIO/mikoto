import { SophonCore } from '@sophon-js/server/dist';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';
import { Server } from 'socket.io';
import { log } from 'winston';

import { MainService } from '.';
import { env } from '../env';
import { logger } from '../functions/logger';
import { prisma } from '../functions/prisma';
import { RedisPubSub } from '../functions/pubsub';
import { redis } from '../functions/redis';
import { buildPubSub } from './events';
import { SophonContext } from './schema';

type MikotoRedis = RedisPubSub<ReturnType<typeof buildPubSub>>;

declare module './schema' {
  interface SophonContext {
    user: { sub: string };
    pubsub: MikotoRedis;
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
  async connect({ params, join, id }) {
    try {
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

      const pubsub: MikotoRedis = new RedisPubSub<
        ReturnType<typeof buildPubSub>
      >(redis, buildPubSub(mainService, id));
      const toSub = [...spaces.map((x) => `space:${x.id}`)];
      if (toSub.length > 0) {
        await pubsub.sub(toSub);
      }
      pubsub.on();

      return {
        pubsub,
        user,
      };
    } catch (e) {
      logger.error(e);
      throw new Error('wtf');
    }
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
