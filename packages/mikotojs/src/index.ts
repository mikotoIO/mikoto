import { MikotoClient } from './MikotoClient';

interface MikotoConstructOptions {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

function constructMikotoSimple(options: MikotoConstructOptions) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      let connected = false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikoto = new MikotoClient(options.url, options.token, {
        onReady: (m) => {
          connected = true;
          resolve(m);
        },
        onConnect: () => {
          options.onConnect?.();
        },
        onDisconnect: () => {
          if (!connected) {
            reject(new Error('Disconnected'));
          }
          options.onDisconnect?.();
        },
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function constructMikoto(options: MikotoConstructOptions) {
  const mikoto = new MikotoClient(options.url, options.token, {});
  await Promise.all([mikoto.spaces.list(true), mikoto.getMe()]);
  return mikoto;
}

export * from './models';
export * from './emitters';
export * from './AuthClient';
export * from './MikotoClient';
export * from './store';

export * from './api.gen';
