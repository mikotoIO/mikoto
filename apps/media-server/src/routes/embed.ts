import { FastifyReply, FastifyRequest } from 'fastify';
import urlMetadata from 'url-metadata';
import { z } from 'zod';

const embedResult = z
  .object({
    title: z.string(),
    description: z.string(),

    image: z.string(),
    'og:image': z.string(),
    'twitter:image': z.string(),

    url: z.string(),
    video: z.string(),
  })
  .partial()
  .transform(({ 'og:image': ogImage, 'twitter:image': twImage, ...val }) => {
    return {
      ...val,
      image: val.image || ogImage || twImage,
    };
  });

export async function embed(req: FastifyRequest, res: FastifyReply) {
  const { w: website } = req.query as { w: string };
  const metadata = await urlMetadata(website);

  return embedResult.parse(metadata);
}
