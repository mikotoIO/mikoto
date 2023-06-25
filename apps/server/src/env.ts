import { load } from 'ts-dotenv';

export const env = load({
  SECRET: String,
  AUTH_PORT: Number,
  SERVER_PORT: Number,
  MINIO: String,
  LIVEKIT_SERVER: String,
  LIVEKIT_KEY: String,
  LIVEKIT_SECRET: String,
});