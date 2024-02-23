import 'reflect-metadata';

import { Hocuspocus } from '@hocuspocus/server';
import {
  HyperschemaServer,
  JSONWriter,
  SocketIOTransport,
  TypeScriptWriter,
  writeHyperschema,
  writeTypeScriptClient,
} from '@hyperschema/core';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import * as http from 'http';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import {
  UnauthorizedError,
  useContainer,
  useExpressServer,
} from 'routing-controllers';
import socketio from 'socket.io';
import { Container } from 'typedi';

import { AccountController } from './controllers/AccountController';
import { env } from './env';
import Mailer from './functions/Mailer';
import { logger } from './functions/logger';
import './functions/prismaRecursive';
import { redis } from './functions/redis';
import * as hs from './hyperschema';
import { CustomErrorHandler } from './middlewares/CustomErrorHandler';

// Auth-related code
// relies way too much on routing-controllers
// TODO: please refactor

const app = express();

const server = new http.Server(app);
const io = new socketio.Server(server, {
  cors: { origin: '*' },
});

const prisma = new PrismaClient({
  // log: ['error'],
});

Container.set(PrismaClient, prisma);
Container.set(socketio.Server, io);
Container.set(Mailer, new Mailer());

app.use(cors());

useContainer(Container);

useExpressServer(app, {
  controllers: [AccountController],
  middlewares: [CustomErrorHandler],
  defaultErrorHandler: false,
  currentUserChecker: (action) => {
    let authHeader = action.request.headers.authorization as string;
    if (!authHeader) throw new UnauthorizedError('No Header');
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid Header');
    }
    authHeader = authHeader.slice(7);
    return jwt.verify(authHeader, env.SECRET);
  },
});

// here we go
async function main() {
  await redis.connect();

  server.listen(env.AUTH_PORT, () => {
    logger.info(`Mikoto auth started on http://0.0.0.0:${env.AUTH_PORT}`);
  });

  // set up a HyperRPC server as well
  const hss = new HyperschemaServer({
    system: hs,
    root: hs.MainService,
    transports: [
      new SocketIOTransport({
        port: env.SERVER_PORT,
        meta: { name: 'Mikoto', protocol: 'hyperschema' },
      }),
    ],
    writers: [
      new TypeScriptWriter(
        path.join(__dirname, '../../../packages/mikotojs/src/hs-client.ts'),
      ),
      new JSONWriter(path.join(__dirname, '../hyperschema.json')),
    ],
  });
  const GENERATE_HYPERSCHEMA = env.MIKOTO_ENV === 'DEV';
  hss.start({ generate: GENERATE_HYPERSCHEMA }).then(() => {
    if (env.MIKOTO_ENV === 'DEV') {
      logger.info('Hyperschema generated!');
    }
    logger.info(
      `Mikoto hyperschema listening on http://0.0.0.0:${env.SERVER_PORT}`,
    );
  });

  // start hocuspocus
  const hocuspocus = new Hocuspocus({
    port: env.COLLAB_PORT,
    quiet: true,
  });

  hocuspocus.listen(async () => {
    logger.info(`Hocuspocus started!`);
  });
}

main().then();
