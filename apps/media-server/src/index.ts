// set up fastify
import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { env } from './env';
import { serve } from './routes/serve';
import { upload } from './routes/upload';

const server = Fastify({ logger: true });
server.register(multipart);

server.get('/', async () => ({ hello: 'world' }));

server.get('/:storeName/:fileName', serve);
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
