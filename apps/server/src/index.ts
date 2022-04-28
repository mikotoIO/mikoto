import 'reflect-metadata';
import 'dotenv/config';

import { useContainer, useExpressServer } from 'routing-controllers';
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
import constants from './constants';

const app = express();
const server = new http.Server(app);
const io = new socketio.Server(server, {
  cors: { origin: '*' },
});

const prisma = new PrismaClient();
Container.set(PrismaClient, prisma);
Container.set(socketio.Server, io);

app.use(cors());

useContainer(Container);
useSocketContainer(Container);

useExpressServer(app, {
  controllers: [path.join(`${__dirname}/controllers/*.js`)],
});

useSocketServer(io, {
  controllers: [path.join(`${__dirname}/ws-controllers/*.js`)],
});

server.listen(constants.apiPort, () => {
  console.log(`Mikoto server started! listening on ${constants.getApiPath()}`);
});
