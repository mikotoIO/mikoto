import { MikotoClient } from '@mikoto-io/mikoto.js';
import React, { createContext, useEffect, useRef, useState } from 'react';

import { env } from '../env';
import { authClient } from './auth';

export const MikotoContext = createContext<MikotoClient | null>(null);
export const AuthContext = createContext(authClient);

type ConnectionState = MikotoClient | 'connecting' | 'disconnected' | 'error';

interface MikotoClientProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: unknown) => void;
}

export function MikotoClientProvider({
  children,
  fallback,
  onError,
}: MikotoClientProviderProps) {
  const [state, setState] = useState<ConnectionState>('connecting');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const mi = new MikotoClient({
      url: env.PUBLIC_SERVER_URL,
      auth: authClient,
    });

    (async () => {
      try {
        await Promise.all([mi.spaces.list(), mi.user.load()]);
        setState(mi);
      } catch (e) {
        console.error('Failed to connect to Mikoto API:', e);
        setState('error');
        onError?.(e);
      }
    })();

    return () => {
      mi.disconnect();
      setState('disconnected');
    };
  }, []);

  if (!(state instanceof MikotoClient)) {
    return <>{fallback}</>;
  }

  return (
    <MikotoContext.Provider value={state}>
      <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
