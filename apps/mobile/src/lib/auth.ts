import { AuthClient } from '@mikoto-io/mikoto.js';
import * as SecureStore from 'expo-secure-store';

import { env } from '../env';

const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

// SecureStore is synchronous-access on native but we need to handle the async case
let cachedRefreshToken: string | null = null;

export async function loadRefreshToken(): Promise<string> {
  if (cachedRefreshToken) return cachedRefreshToken;
  const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  cachedRefreshToken = token ?? '';
  return cachedRefreshToken;
}

export async function saveRefreshToken(token: string): Promise<void> {
  cachedRefreshToken = token;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  cachedRefreshToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function createAuthClient(): AuthClient {
  return new AuthClient({
    url: env.PUBLIC_SERVER_URL,
    refreshToken: () => cachedRefreshToken ?? '',
    setRefreshToken: (token) => {
      saveRefreshToken(token);
    },
  });
}

export const authClient = createAuthClient();
