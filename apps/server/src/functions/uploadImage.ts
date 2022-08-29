import { Client } from 'minio';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import { mimeImageExtension } from './checkMimetype';

const minioCdn = new URL(process.env.MINIO!);

export async function uploadImage(
  minio: Client,
  bucket: string,
  file: Express.Multer.File,
) {
  const id = uuid();
  mimeImageExtension(file.mimetype);
  const fileName = `${id}.png`;
  const resized = await sharp(file.buffer)
    .resize({
      width: 128,
      height: 128,
    })
    .png()
    .toBuffer();
  await minio.putObject(bucket, fileName, resized);
  return {
    url: `${minioCdn.protocol}//${minioCdn.host}/avatar/${fileName}`,
  };
}
