import { FastifyReply, FastifyRequest } from 'fastify';
import mime from 'mime-types';
import sharp from 'sharp';
import { Stream } from 'stream';

import { storage } from '../minio';

async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buf = Array<any>();

    stream.on('data', (chunk) => buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buf)));
    stream.on('error', (err) =>
      reject(new Error(`error converting stream - ${err}`)),
    );
  });
}

const CACHE_CONTROL = 'public, max-age=31536000, must-revalidate, immutable';

export async function serve(req: FastifyRequest, res: FastifyReply) {
  const { storeName, '*': fileName } = req.params as {
    storeName: string;
    '*': string;
  };
  const contentType = mime.contentType(fileName) || 'application/octet-stream';
  const fileBuffer = await storage.fetch(`${storeName}/${fileName}`);
  if (contentType.startsWith('image')) {
    // handle resize for w and h
    const { w, h } = req.query as { w?: string; h?: string };
    const width = parseInt(w as string, 10);
    const height = parseInt(h as string, 10);
    if (width && height) {
      const image = sharp(await stream2buffer(fileBuffer));
      const metadata = await image.metadata();
      const resized = image
        .resize(
          Math.min(width, metadata.width ?? 4096),
          Math.min(height, metadata.height ?? 4096),
        )
        .toBuffer();
      res.header('Content-Type', 'image/png');
      res.header('Cache-Control', CACHE_CONTROL);
      return resized;
    }
  }

  res.header('Content-Type', contentType);
  res.header('Cache-Control', CACHE_CONTROL);
  return fileBuffer;
}
