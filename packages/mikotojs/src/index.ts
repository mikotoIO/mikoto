import { MikotoClient } from './MikotoClient';

function constructMikotoSimple(sophonUrl: string, token: string) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let connected = false;
      const mikotoApi = new MikotoClient(sophonUrl, token, {
        onReady: (m) => {
          connected = true;
          resolve(m);
        },
        onDisconnect: () => {
          if (!connected) {
            reject(new Error('Disconnected'));
          }
        },
      });
    } catch (e) {
      reject(e);
    }
  });
}

export interface ConstructMikotoOptions {
  urlBase: string;
  token: string;
}

export async function constructMikoto({
  urlBase,
  token,
}: ConstructMikotoOptions) {
  const mikoto = await constructMikotoSimple(urlBase, token);
  await Promise.all([mikoto.spaces.list(true), mikoto.getMe()]);
  if (typeof window !== 'undefined') {
    (window as any).client = mikoto;
  }
  return mikoto;
}

export * from './models';
export * from './emitters';
export * from './AuthClient';
export * from './MikotoClient';
export * from './store';
