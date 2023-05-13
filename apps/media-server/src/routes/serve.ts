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

export async function serve(req: FastifyRequest, res: FastifyReply) {
  const { storeName, fileName } = req.params as {
    storeName: string;
    fileName: string;
  };
  const contentType = mime.contentType(fileName) || 'application/octet-stream';
  const fileBuffer = await storage.fetch(`${storeName}/${fileName}`);
  if (contentType.startsWith('image')) {
    // handle resize for w and h
    const { w, h } = req.query as { w?: string; h?: string };
    const width = parseInt(w as string, 10);
    const height = parseInt(h as string, 10);
    if (width && height) {
      const image = await sharp(await stream2buffer(fileBuffer))
        .resize(width, height)
        .toBuffer();
      res.header('Content-Type', 'image/png');
      return image;
    }
  }

  res.header('Content-Type', contentType);
  return fileBuffer;
}
