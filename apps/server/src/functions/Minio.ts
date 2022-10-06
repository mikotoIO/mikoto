import * as minio from 'minio';
import { Client } from 'minio';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import { mimeImageExtension } from './checkMimetype';

export default class Minio {
  public client: minio.Client;
  public host: string;

  constructor(url: string) {
    const parsed = new URL(url);
    this.client = new minio.Client({
      endPoint: parsed.hostname,
      port: parseInt(parsed.port, 10),
      useSSL: parsed.protocol === 'https:',
      accessKey: parsed.username,
      secretKey: parsed.password,
    });
    this.host = `${parsed.protocol}//${parsed.host}`;
  }

  async uploadImage(bucket: string, file: Express.Multer.File) {
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
    await this.client.putObject(bucket, fileName, resized);
    return {
      url: `${this.host}/avatar/${fileName}`,
    };
  }
}
