import { AuthClient } from './AuthClient';
import { MikotoClient } from './MikotoClient';

function constructMikotoSimple(sophonUrl: string, token: string) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(sophonUrl, token, (m) => {
        resolve(m);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function constructMikoto(authUrl: string, sophonUrl: string) {
  const ac = new AuthClient(authUrl);
  const token = await ac.refresh({
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
    accessToken: '',
  });
  localStorage.setItem('REFRESH_TOKEN', token.refreshToken);
  const mikoto = await constructMikotoSimple(sophonUrl, token.accessToken);

  await mikoto.client.spaces.list();
  return mikoto;
}

export * from './models';
export * from './emitters';
export * from './AuthClient';
export * from './MikotoClient';
