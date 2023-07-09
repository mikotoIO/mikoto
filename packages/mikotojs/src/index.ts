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

export async function constructMikoto(accessToken: string, sophonUrl: string) {
  const mikoto = await constructMikotoSimple(sophonUrl, accessToken);

  await mikoto.client.spaces.list();
  return mikoto;
}

export * from './models';
export * from './emitters';
export * from './AuthClient';
export * from './MikotoClient';
