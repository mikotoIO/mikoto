import { load } from 'ts-dotenv';

export const env = load(
  {
    MEDIASERVER_PORT: Number,
    PUBLIC_MEDIASERVER_URL: String,

    S3_ACCESS_KEY: String,
    S3_SECRET_KEY: {
      type: String,
      optional: true,
    },
    S3_USE_SSL: {
      type: Boolean,
      optional: true,
    },
    S3_ENDPOINT: String,
    S3_BUCKET: String,
    S3_PORT: {
      type: Number,
      optional: true,
    },
  },
  '../../.env',
);
