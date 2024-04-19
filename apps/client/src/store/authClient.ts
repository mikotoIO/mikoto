import { AuthClient } from 'mikotojs';

import { env } from '@/env';

export const authClient = new AuthClient(env.PUBLIC_AUTH_URL);
