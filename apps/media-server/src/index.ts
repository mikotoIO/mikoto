// set up fastify
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { env } from './env';
import { serve } from './routes/serve';
import { upload } from './routes/upload';

const server = Fastify({ logger: true });
server.register(multipart);
server.register(cors, { origin: '*' });

server.get('/', async () => ({ hello: 'world' }));

server.get('/:storeName/*', serve);
server.post('/:storeName', upload);

const start = async () => {
  try {
    await server.listen({
      host: '0.0.0.0',
      port: env.MEDIASERVER_PORT,
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
