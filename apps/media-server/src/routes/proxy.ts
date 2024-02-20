import axios from 'axios';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function proxy(req: FastifyRequest, res: FastifyReply) {
  const { url } = req.query as { url: string };
  const { data, headers } = await axios.get(url, {
    responseType: 'arraybuffer',
    maxContentLength: 50 * 1024 * 1024,
  });

  const contentType = headers['content-type'] as string | undefined;
  if (!(contentType?.startsWith('image') || contentType?.startsWith('video'))) {
    res.status(404).send();
    return;
  }

  res.status(200).header('Content-Type', contentType).send(Buffer.from(data));
}
