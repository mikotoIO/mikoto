import 'reflect-metadata';
import 'dotenv/config';

import {
  UnauthorizedError,
  useContainer,
  useExpressServer,
} from 'routing-controllers';
import * as path from 'path';
import socketio from 'socket.io';
import {
  useContainer as useSocketContainer,
  useSocketServer,
} from 'socket-controllers';
import { Container } from 'typedi';
import * as http from 'http';
import cors from 'cors';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import * as minio from 'minio';
import { logger } from './functions/logger';
import { minioFromURL } from './functions/minioFromURL';

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
Container.set(minio.Client, minioFromURL(process.env.MINIO!));

app.use(cors());

useContainer(Container);
useSocketContainer(Container);

useExpressServer(app, {
  controllers: [path.join(`${__dirname}/controllers/*.js`)],
  middlewares: [path.join(`${__dirname}/middlewares/*.js`)],
  defaultErrorHandler: false,
  currentUserChecker: (action) => {
    let authHeader = action.request.headers.authorization as string;
    if (!authHeader) throw new UnauthorizedError('No Header');
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid Header');
    }
    authHeader = authHeader.slice(7);
    return jwt.verify(authHeader, process.env.SECRET!);
  },
});

useSocketServer(io, {
  controllers: [path.join(`${__dirname}/ws-controllers/*.js`)],
});

server.listen(process.env.PORT || 9500, () => {
  logger.info(`Mikoto server listening on port ${process.env.PORT || 9500}`);
});
