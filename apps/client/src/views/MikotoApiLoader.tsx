import { AxiosError } from 'axios';
import { MikotoClient, constructMikoto } from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';

import { env } from '../env';
import { refreshAuth } from '../functions/refreshAuth';
import { AuthContext, MikotoContext, useInterval } from '../hooks';
import { onlineState } from '../store';
import { authClient } from '../store/authClient';

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

export function MikotoApiLoader({ children, fallback }: ApiLoaderProps) {
  const [mikoto, setMikoto] = useState<MikotoClient | null>(null);
  const [err, setErr] = useState<AxiosError | null>(null);
  const setOnlineState = useSetRecoilState(onlineState);

  const buildMikotoClient = async () => {
    try {
      const token = await refreshAuth(authClient);
      const mi = await constructMikoto({
        token,
        url: env.PUBLIC_SERVER_URL,
        onConnect() {
          setOnlineState(true);
        },
        onDisconnect() {
          setOnlineState(false);
        },
      });
      return setMikoto(mi);
    } catch (e) {
      return setErr(e as AxiosError);
    }
  };

  // TODO: Try suspense
  useEffect(() => {
    if (clientLock) return;
    clientLock = true;

    buildMikotoClient().then();
  }, []);

  useInterval(() => {
    if (mikoto === null) return; // must have loaded at least once

    Promise.race([wait(15 * 1000), mikoto.client.ping({})]).catch(() => {
      console.error('Ping failed, websocket timeout');
      buildMikotoClient().then();
    });
  }, 30 * 1000);

  if (err !== null) {
    console.log('this should only redirect auth-related errors');
    console.log(err);
    return <Navigate to="/login" />;
  }
  if (mikoto === null) return fallback;

  return (
    <MikotoContext.Provider value={mikoto}>
      <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
