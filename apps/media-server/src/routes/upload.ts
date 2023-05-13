import crypto from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import mime from 'mime-types';
import sharp from 'sharp';

import { env } from '../env';
import { storage } from '../minio';
import { storeConfig } from '../store';

export async function upload(req: FastifyRequest, res: FastifyReply) {
  const data = await req.file();
  const { storeName } = req.params as { storeName: string };
  if (!data) {
    return res.status(400).send({ error: 'No file uploaded' });
  }

  const store = storeConfig[storeName];
  if (!store) {
    return res.status(400).send({ error: 'Invalid store' });
  }

  const { restrictions, transformations } = store;
  let fileBuffer = await data.toBuffer();
  let extension = mime.extension(data.mimetype);
  // eslint-disable-next-line no-restricted-syntax
  for (const restriction of restrictions) {
    switch (restriction.id) {
      case 'IS_FILETYPE':
        if (!data.mimetype.startsWith(restriction.type)) {
          return res.status(400).send({ error: 'Invalid file type' });
        }
        break;
      case 'MAX_FILESIZE':
        if (fileBuffer.length > restriction.size) {
          return res.status(400).send({ error: 'File too large' });
        }
        break;
      default:
        break;
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const transformation of transformations) {
    switch (transformation.id) {
      case 'RESIZE':
        // eslint-disable-next-line no-await-in-loop
        fileBuffer = await sharp(fileBuffer)
          .resize({
            width: transformation.width,
            height: transformation.height,
          })
          .png()
          .toBuffer();
        extension = 'png';
        break;
      default:
        break;
    }
  }
  const path = `${storeName}/${crypto.randomUUID()}.${extension}`;
  await storage.upload(path, fileBuffer);
  return { url: `${env.PUBLIC_MEDIASERVER_URL}/${path}` };
}
