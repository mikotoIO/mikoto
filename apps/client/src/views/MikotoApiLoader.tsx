import { MikotoClient, constructMikoto } from 'mikotojs';
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '../env';
import { refreshAuth } from '../functions/refreshAuth';
import { AuthContext, MikotoContext } from '../hooks';
import { authClient } from '../store/authClient';

export function MikotoApiLoader({ children }: { children: React.ReactNode }) {
  const [mikoto, setMikoto] = React.useState<MikotoClient | null>(null);
  const [err, setErr] = React.useState<unknown>(null);

  // TODO: Try suspense
  useEffect(() => {
    refreshAuth(authClient)
      .then((accessToken) =>
        constructMikoto(accessToken, env.PUBLIC_SERVER_URL),
      )
      .then((mi) => setMikoto(mi))
      .catch((e) => setErr(e));
  }, []);

  if (err !== null) {
    console.log(err);
    return <Navigate to="/login" />;
  }
  if (mikoto === null) return null;
  return (
    <MikotoContext.Provider value={mikoto}>
      <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
