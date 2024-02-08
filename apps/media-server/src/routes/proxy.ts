import { FastifyRequest, FastifyReply } from 'fastify';

export async function proxy(req: FastifyRequest, res: FastifyReply) {
  const { url } = req.query as { url: string };
  // request HEAD
  return {};
}
