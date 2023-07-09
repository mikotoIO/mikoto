import { AuthClient } from 'mikotojs';

export async function refreshAuth(client: AuthClient) {
  const { refreshToken, accessToken } = await client.refresh({
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
    accessToken: '',
  });
  localStorage.setItem('REFRESH_TOKEN', refreshToken);
  return accessToken;
}
