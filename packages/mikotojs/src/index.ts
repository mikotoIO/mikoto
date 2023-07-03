import { AuthClient } from './AuthClient';
import { MikotoClient } from './MikotoClient';

function constructMikotoSimple(
  authClient: AuthClient,
  sophonUrl: string,
  token: string,
) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(authClient, sophonUrl, token, (m) => {
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
  const mikoto = await constructMikotoSimple(ac, sophonUrl, token.accessToken);

  // await refreshAccess(mikoto);
  // setInterval(() => {
  //   refreshAccess(mikoto).then(() => {
  //     console.log('refreshed');
  //   });
  // }, 10 * 60 * 1000);

  await mikoto.client.spaces.list();
  return mikoto;
}

export * from './models';
export * from './emitters';
export * from './AuthClient';
export * from './MikotoClient';
