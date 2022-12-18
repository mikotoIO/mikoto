import React, { useContext } from 'react';

import { MikotoClient } from './MikotoClient';
import * as authAPI from './auth';

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}

function constructMikotoSimple(url: string) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(url, (m) => {
        resolve(m);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function refreshAccess(mikoto: MikotoClient) {
  const t = await authAPI.refresh({
    accessToken: '',
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
  });
  localStorage.setItem('REFRESH_TOKEN', t.refreshToken);
  mikoto.updateAccessToken(t.accessToken);
}

export async function constructMikoto(url: string) {
  const mikoto = await constructMikotoSimple(url);

  await refreshAccess(mikoto);
  setInterval(() => {
    refreshAccess(mikoto).then(() => {
      console.log('refreshed');
    });
  }, 10 * 60 * 1000);

  await mikoto.getSpaces();
  return mikoto;
}

export * from './entities';
export * from './instances';
export * from './engines';
export * as authAPI from './auth';
export * from './MikotoClient';
