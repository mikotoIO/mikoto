import { AuthClient, MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import React, { useContext, useEffect } from 'react';
import { Snapshot, getVersion, proxy, useSnapshot } from 'valtio';

import { useInterval } from './useInterval';

export { useInterval };

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto(): MikotoClient {
  return useContext(MikotoContext);
}

export const AuthContext = React.createContext<AuthClient>(undefined!);

export function useAuthClient() {
  return useContext(AuthContext);
}

export function useEvent() {}

export const useFetchMember = (space: MikotoSpace) => {
  useEffect(() => {
    space.members.list();
  }, [space.id]);
};

const SENTINEL_PROXY = proxy({ __NOTHING__: true });

export function useMaybeSnapshot<T>(
  proxyObject: T,
  options?: {
    sync?: boolean;
  },
): T {
  const isProxy = typeof getVersion(proxyObject) === 'number';
  const res = useSnapshot(
    isProxy ? (proxyObject as object) : SENTINEL_PROXY,
    options,
  ) as any;
  if (res.__NOTHING__) return proxyObject as any;
  return res;
}
