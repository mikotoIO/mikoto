import 'dotenv/config';
import 'reflect-metadata';

import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import * as http from 'http';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import {
  UnauthorizedError,
  useContainer,
  useExpressServer,
} from 'routing-controllers';
import {
  useContainer as useSocketContainer,
  useSocketServer,
} from 'socket-controllers';
import socketio, { Server } from 'socket.io';
import { Container } from 'typedi';

import Mailer from './functions/Mailer';
import Minio from './functions/Minio';
import { logger } from './functions/logger';
import './functions/prismaRecursive';
import { mainService } from './services';
import { sophon } from './services/sophon';

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
Container.set(Minio, new Minio(process.env.MINIO!));
Container.set(Mailer, new Mailer());

app.use(cors());

useContainer(Container);
useSocketContainer(Container);

useExpressServer(app, {
  controllers: [path.join(`${__dirname}/controllers/*.{js,ts}`)],
  middlewares: [path.join(`${__dirname}/middlewares/*.{js,ts}`)],
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
  controllers: [path.join(`${__dirname}/ws-controllers/*.{js,ts}`)],
});

const port = parseInt(process.env.PORT || '', 10) || 9500;
const host = process.env.HOST || 'localhost';

server.listen(port, host, () => {
  logger.info(`Mikoto server started on http://${host}:${port}`);
});

// set up a sophon server as well
const httpServer = createServer();
const sophonIO = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});
sophon.mount(sophonIO, mainService);
httpServer.listen(3510, () => {
  console.log('Sophon on *:3510');
});
