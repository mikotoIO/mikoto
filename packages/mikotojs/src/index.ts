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
