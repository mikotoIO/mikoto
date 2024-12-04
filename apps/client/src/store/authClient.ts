import { AuthClient } from '@mikoto-io/mikoto.js';

import { env } from '@/env';

export const authClient = new AuthClient({
  url: env.PUBLIC_SERVER_URL,
  refreshToken: () => {
    return localStorage.getItem('REFRESH_TOKEN') ?? '';
  },
  setRefreshToken: (token) => {
    localStorage.setItem('REFRESH_TOKEN', token);
  },
});
