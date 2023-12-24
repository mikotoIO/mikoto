import { AxiosError } from 'axios';
import { MikotoClient, constructMikoto } from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';

import { env } from '../env';
import { refreshAuth } from '../functions/refreshAuth';
import { AuthContext, MikotoContext } from '../hooks';
import { onlineState } from '../store';
import { authClient } from '../store/authClient';

// This exists to "cheat" React Strict Mode
let clientLock = false;

interface ApiLoaderProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function MikotoApiLoader({ children, fallback }: ApiLoaderProps) {
  const [mikoto, setMikoto] = useState<MikotoClient | null>(null);
  const [err, setErr] = useState<AxiosError | null>(null);
  const setOnlineState = useSetRecoilState(onlineState);

  // TODO: Try suspense
  useEffect(() => {
    if (clientLock) return;
    clientLock = true;

    refreshAuth(authClient)
      .then((token) =>
        constructMikoto({
          token,
          url: env.PUBLIC_SERVER_URL,
          onConnect() {
            setOnlineState(true);
          },
          onDisconnect() {
            setOnlineState(false);
          },
        }),
      )
      .then((mi) => setMikoto(mi))
      .catch((e) => setErr(e as AxiosError));
  }, []);

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
