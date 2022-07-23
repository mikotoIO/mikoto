import * as minio from 'minio';

export function minioFromURL(url: string) {
  const parsed = new URL(url);
  return new minio.Client({
    endPoint: parsed.hostname,
    port: parseInt(parsed.port, 10),
    useSSL: parsed.protocol === 'https:',
    accessKey: parsed.username,
    secretKey: parsed.password,
  });
}
