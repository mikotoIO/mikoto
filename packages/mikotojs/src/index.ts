import { AuthClient } from './AuthClient';
import { MikotoClient } from './MikotoClient';

function constructMikotoSimple(url: string, token: string) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(url, token, (m) => {
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

export async function constructMikoto(url: string) {
  const ac = new AuthClient(url);
  const token = await ac.refresh({
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
    accessToken: '',
  });
  localStorage.setItem('REFRESH_TOKEN', token.refreshToken);
  const mikoto = await constructMikotoSimple(url, token.accessToken);

  // await refreshAccess(mikoto);
  // setInterval(() => {
  //   refreshAccess(mikoto).then(() => {
  //     console.log('refreshed');
  //   });
  // }, 10 * 60 * 1000);

  await mikoto.getSpaces();
  return mikoto;
}

export * from './entities';
export * from './instances';
export * from './engines';
export * from './AuthClient';
export * from './MikotoClient';
