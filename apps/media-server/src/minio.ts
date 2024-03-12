import * as minio from 'minio';
import { getS3Endpoint } from 'minio/dist/main/internal/s3-endpoints';

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
  public bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.client = new minio.Client({
      endPoint: env.S3_ENDPOINT,
      port: env.S3_PORT,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY ?? '',
      useSSL: env.S3_USE_SSL,
    });
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

export const storage = new Minio();
