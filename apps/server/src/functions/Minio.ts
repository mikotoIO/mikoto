import * as minio from 'minio';

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
}
