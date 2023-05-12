import { MultipartFile } from '@fastify/multipart';
import crypto from 'crypto';
import * as minio from 'minio';
import sharp from 'sharp';

import { env } from './env';

export function mimeImageExtension(mime: string) {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    default:
      throw new Error('Only .png and .jpg supported');
  }
}
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

  async upload(fileName: string, file: Buffer) {
    await this.client.putObject(this.bucket, fileName, file);
    return `${this.bucket}/${fileName}`;
  }

  async fetch(fileName: string) {
    const stream = await this.client.getObject(this.bucket, fileName);
    return stream;
  }
}

export const storage = new Minio(env.MINIO);
