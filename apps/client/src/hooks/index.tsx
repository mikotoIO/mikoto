import { AuthClient, MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import React, { useContext, useEffect, useState } from 'react';
import { getVersion, proxy, useSnapshot } from 'valtio';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMembers = async () => {
      if (!space?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        // Force a direct fetch from server
        await space.members.list();
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [space?.id]);

  return { isLoading, error };
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
