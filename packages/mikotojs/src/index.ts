import { AuthClient } from './AuthClient';
import { MikotoClient } from './MikotoClient';

function constructMikotoSimple(
  authUrl: string,
  sophonUrl: string,
  token: string,
) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(authUrl, sophonUrl, token, (m) => {
        resolve(m);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function refreshAccess(mikoto: MikotoClient) {
  const t = await mikoto.authAPI.refresh({
    accessToken: '',
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
  });
  localStorage.setItem('REFRESH_TOKEN', t.refreshToken);
  mikoto.updateAccessToken(t.accessToken);
}

export async function constructMikoto(authUrl: string, sophonUrl: string) {
  const ac = new AuthClient(authUrl);
  const token = await ac.refresh({
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
    accessToken: '',
  });
  localStorage.setItem('REFRESH_TOKEN', token.refreshToken);
  const mikoto = await constructMikotoSimple(
    authUrl,
    sophonUrl,
    token.accessToken,
  );

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
