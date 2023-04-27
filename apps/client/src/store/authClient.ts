import { AuthClient } from 'mikotojs';

export const authClient = new AuthClient(
  import.meta.env.MIKOTO_AUTH ?? 'http://localhost:9500',
);
