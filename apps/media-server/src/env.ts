import { load } from 'ts-dotenv';

export const env = load(
  {
    MINIO: String,
    MEDIASERVER_PORT: Number,
    PUBLIC_MEDIASERVER_URL: String,
  },
  '../../.env',
);
