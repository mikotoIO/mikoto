import { AuthClient } from 'mikotojs';

export async function refreshAuth(client: AuthClient) {
  const { refreshToken, accessToken } = await client.refresh(
    localStorage.getItem('REFRESH_TOKEN')!,
  );
  if (refreshToken) {
    localStorage.setItem('REFRESH_TOKEN', refreshToken);
  }
  return accessToken;
}
