import crypto from 'crypto';
import * as minio from 'minio';
import sharp from 'sharp';

import { mimeImageExtension } from './checkMimetype';

export default class Minio {
  public client: minio.Client;
  public host: string;
  public bucket: string;

  constructor(url: string) {
    const parsed = new URL(url);

    this.bucket = parsed.pathname.slice(1);
    this.client = new minio.Client({
      endPoint: parsed.hostname,
      port: parseInt(parsed.port, 10),
      useSSL: parsed.protocol === 'https:',
      accessKey: parsed.username,
      secretKey: parsed.password,
    });
    this.host = `${parsed.protocol}//${parsed.host}`;
  }

  async uploadImage(path: string, file: Express.Multer.File) {
    const id = crypto.randomUUID();
    mimeImageExtension(file.mimetype);
    const fileName = `${path}/${id}.png`;
    const resized = await sharp(file.buffer)
      .resize({
        width: 128,
        height: 128,
      })
      .png()
      .toBuffer();
    await this.client.putObject(this.bucket, fileName, resized);
    return {
      url: `${this.host}/${this.bucket}/${fileName}`,
    };
  }
}
