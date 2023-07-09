import { AuthClient, MikotoClient, constructMikoto } from 'mikotojs';
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '../env';
import { AuthContext, MikotoContext } from '../hooks';

export function MikotoApiLoader({ children }: { children: React.ReactNode }) {
  const [mikoto, setMikoto] = React.useState<MikotoClient | null>(null);
  const [err, setErr] = React.useState<unknown>(null);

  const auth = new AuthClient(env.PUBLIC_AUTH_URL);

  // TODO: Try suspense
  useEffect(() => {
    constructMikoto(env.PUBLIC_AUTH_URL, env.PUBLIC_SERVER_URL)
      .then((x) => setMikoto(x))
      .catch((x) => setErr(x));
  }, []);

  if (err !== null) {
    console.log(err);
    return <Navigate to="/login" />;
  }
  if (mikoto === null) return null;
  return (
    <MikotoContext.Provider value={mikoto}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
