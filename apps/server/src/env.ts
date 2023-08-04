import { load } from 'ts-dotenv';

export const env = load({
  SECRET: String,
  REDIS_URL: String,
  AUTH_PORT: Number,
  SERVER_PORT: Number,
  MINIO: String,
  LIVEKIT_SERVER: String,
  LIVEKIT_KEY: String,
  LIVEKIT_SECRET: String,
  WEB_CLIENT: String,
  LOG_LEVEL: {
    type: String,
    default: 'info',
  },
  AXIOM_TOKEN: {
    type: String,
    optional: true,
  },
});
