import { MikotoClient } from '@mikoto-io/mikoto.js';
import { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '@/env';
import { AuthContext, MikotoContext } from '@/hooks';
import { authClient } from '@/store/authClient';

function registerNotifications(_mikoto: MikotoClient) {
  // mikoto.client.messages.onCreate((msg) => {
  //   notifyFromMessage(mikoto, msg);
  // });
}

interface MikotoClientProviderProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// exists to "cheat" React Strict Mode

type MikotoConnectionState =
  | MikotoClient
  | 'connecting'
  | 'reconnecting'
  | 'disconnected';

export function MikotoClientProvider({
  children,
  fallback,
}: MikotoClientProviderProps) {
  const [mikoto, setMikoto] = useState<MikotoConnectionState>('connecting');
  const [err, setErr] = useState<AxiosError | null>(null);

  const setupMikotoClient = async (mi: MikotoClient) => {
    try {
      await Promise.all([mi.spaces.list(), mi.user.load()]);
      (globalThis as any).mikoto = mi;

      registerNotifications(mi);
      setMikoto(mi);
    } catch (e) {
      console.error('Failed to connect to Mikoto API');
      console.error(e);
      setMikoto('disconnected');
      setErr(e as AxiosError);
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // initialized.current = true;

      const mi = new MikotoClient({
        url: env.PUBLIC_SERVER_URL,
        auth: authClient,
      });
      setupMikotoClient(mi);

      return () => {
        mi.disconnect();
        setMikoto('disconnected');
      };
    }

    return () => {};
  }, []);

  // FIXME: Rework the heartbeat system
  // useInterval(() => {
  //   if (!(mikoto instanceof MikotoClient)) {
  //     console.log(`current client state: ${mikoto}: reconnecting`);
  //     buildMikotoClient().then();
  //     return;
  //   }

  //   Promise.race([wait(PING_TIMEOUT), mikoto.client.ping({})]).catch(() => {
  //     console.warn('Ping failed, websocket timeout');
  //     // clean up the old client to avoid memory leaks, before reconnecting
  //     mikoto.disconnect();
  //     setMikoto('reconnecting');
  //     buildMikotoClient().then();
  //   });
  // }, PING_INTERVAL);

  if (err !== null) {
    console.log('this should only redirect auth-related errors');
    console.log(err);
    return <Navigate to="/login" />;
  }
  if (!(mikoto instanceof MikotoClient)) return fallback;

  // TODO: Connection ID key, garbage collection for event emitters
  return (
    <MikotoContext.Provider value={mikoto}>
      <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
