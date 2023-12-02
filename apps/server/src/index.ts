import 'reflect-metadata';

import { Hocuspocus } from '@hocuspocus/server';
import { writeHyperschema, writeTypeScriptClient } from '@hyperschema/core';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
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

async function main() {
  await redis.connect();

  // setup Hyperschema
  if (env.MIKOTO_ENV === 'DEV') {
    logger.info('Generating Hyperschema...');
    await writeTypeScriptClient(
      path.join(__dirname, '../../../packages/mikotojs/src/hs-client.ts'),
      hs,
    );
    await writeHyperschema(path.join(__dirname, '../hyperschema.json'), hs);
    logger.info('Hyperschema generated!');
  }

  server.listen(env.AUTH_PORT, () => {
    logger.info(`Mikoto auth started on http://0.0.0.0:${env.AUTH_PORT}`);
  });

  // set up a HyperRPC server as well
  hs.boot(() => {
    logger.info(
      `Mikoto hyperschema listening on http://0.0.0.0:${env.SERVER_PORT}`,
    );
  });

  // start hocuspocus
  const hocuspocus = new Hocuspocus({
    port: 1234,
    quiet: true,
  });

  hocuspocus.listen(async () => {
    logger.info(`Hocuspocus started!`);
  });
}

main().then();
