import { AxiosError } from 'axios';
import { MikotoClient, constructMikoto } from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '../env';
import { notifyFromMessage } from '../functions/notify';
import { refreshAuth } from '../functions/refreshAuth';
import { AuthContext, MikotoContext, useInterval } from '../hooks';
import { authClient } from '../store/authClient';

function registerNotifications(mikoto: MikotoClient) {
  mikoto.client.messages.onCreate((msg) => {
    notifyFromMessage(mikoto, msg);
  });
}

interface ApiLoaderProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function wait(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

// exists to "cheat" React Strict Mode
let clientLock = false;

type MikotoConnectionState =
  | MikotoClient
  | 'connecting'
  | 'reconnecting'
  | 'disconnected';

export function MikotoApiLoader({ children, fallback }: ApiLoaderProps) {
  const [mikoto, setMikoto] = useState<MikotoConnectionState>('connecting');
  const [err, setErr] = useState<AxiosError | null>(null);

  const buildMikotoClient = async () => {
    try {
      const token = await refreshAuth(authClient);
      const mi = await constructMikoto({
        token,
        url: env.PUBLIC_SERVER_URL,
        onConnect() {},
        onDisconnect() {},
      });
      registerNotifications(mi);
      setMikoto(mi);
    } catch (e) {
      console.error('Failed to connect to Mikoto API');
      console.error(e);
      setMikoto('disconnected');
      setErr(e as AxiosError);
    }
  };

  useEffect(() => {
    if (clientLock) return;
    clientLock = true;

    buildMikotoClient().then();
  }, []);

  useInterval(() => {
    if (!(mikoto instanceof MikotoClient)) {
      console.log(`current client state: ${mikoto}: reconnecting`);
      buildMikotoClient().then();
      return;
    }

    Promise.race([wait(15 * 1000), mikoto.client.ping({})]).catch(() => {
      console.warn('Ping failed, websocket timeout');
      // clean up the old client to avoid memory leaks, before reconnecting
      mikoto.disconnect();
      setMikoto('reconnecting');
      buildMikotoClient().then();
    });
  }, 30 * 1000);

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
