import cors from '@fastify/cors';
import fastify from 'fastify';
import * as socketIO from 'socket.io';

import { HyperRPCService, MetaObject } from '..';
import { AbstractTransportEngine, processError } from './logic';

function setupServiceEvents(socket: socketIO.Socket, service: HyperRPCService) {
  const cleanupFns: (() => void)[] = [];

  // setup service events
  Object.entries(service.events).forEach(([name, event]) => {
    if (event.emitterSetup) {
      const eventPath = service.path === '' ? name : `${service.path}/${name}`;
      const cleanup = event.emitterSetup((x) => {
        socket.emit(eventPath, event.eventType.parse(x));
      }, socket.data);
      if (cleanup) {
        cleanupFns.push(cleanup);
      }
    }
  });

  // setup child service events
  Object.values(service.subservices).forEach((childService) => {
    setupServiceEvents(socket, childService);
  });

  socket.on('disconnect', () => {
    cleanupFns.forEach((fn) => fn());
  });
}

interface SocketIOTransportOptions {
  io?: socketIO.Server;
  port?: number;
  meta?: any;
}

export class SocketIOTransport implements AbstractTransportEngine {
  io: socketIO.Server;
  run: () => Promise<void>;

  constructor(options: SocketIOTransportOptions) {
    if (options.io) {
      this.io = options.io;
      this.run = async () => {};
    } else {
      const app = fastify();
      app.register(cors, {
        origin: '*',
      });
      app.get('/', async () => {
        return options.meta ?? { hello: 'world' };
      });

      this.io = new socketIO.Server(app.server, {
        cors: { origin: '*' },
      });

      this.run = async () => {
        await app.listen({
          host: '0.0.0.0',
          port: options.port ?? 3510,
        });
      };
    }
  }

  mount(service: HyperRPCService): void {
    this.io.use((socket, next) => {
      const meta: MetaObject = {
        connId: socket.id,
        authToken: socket.handshake.auth.token,
      };

      // merge the context into socket.data
      service.hyperRPC
        .contextFn({ $meta: meta })
        .then((res: any) => {
          Object.keys(res).forEach((k) => {
            socket.data.$meta = meta;
            socket.data[k] = res[k];
          });
          next();
        })
        .catch(next);
    });
    this.io.on('connection', async (socket) => {
      socket.onAny(
        (fullPath: string, args: unknown, callback: (resp: any) => void) => {
          try {
            const path = fullPath.split('/');
            const functionName = path.pop()!;
            const endpointSvc = path.reduce(
              (acc, x) => acc.subservices[x],
              service,
            );

            const fn = endpointSvc.functions[functionName];
            fn.call(socket.data, args)
              .then((ok) => callback({ ok }))
              .catch((err) => callback({ err: processError(err) }));
          } catch (err) {
            callback({ err: processError(err) });
          }
        },
      );

      setupServiceEvents(socket, service);
      socket.emit('ready');
    });
  }
}
