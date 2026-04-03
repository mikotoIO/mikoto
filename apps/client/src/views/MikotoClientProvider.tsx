import { MlsClient } from '@mikoto-io/mikoto-crypto';
import { MikotoClient } from '@mikoto-io/mikoto.js';
import { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '@/env';
import { AuthContext, MikotoContext } from '@/hooks';
import { CryptoProvider } from '@/hooks/useCrypto';
import { authClient } from '@/store/authClient';

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;

function registerNotifications(_mikoto: MikotoClient) {
  // mikoto.client.messages.onCreate((msg) => {
  //   notifyFromMessage(mikoto, msg);
  // });
}

function registerMlsHandlers(mikoto: MikotoClient, mlsClient: MlsClient) {
  // Handle incoming MLS Welcome messages (when someone opens a DM with us)
  mikoto.ws.on('mlsMessages.onWelcome', async (msg) => {
    try {
      // Fetch pending welcome messages
      const pending = await mikoto.rest['mlsMessages.list']();
      for (const m of pending) {
        if (m.messageType === 'welcome') {
          // We need to figure out which space this Welcome is for.
          // The mlsGroupId links to a space via the MlsGroup table.
          // For now, join the group and the space will be loaded when accessed.
          await mlsClient.joinDmGroup(m.mlsGroupId, m.data);
        }
      }
    } catch (e) {
      console.error('Failed to process MLS Welcome:', e);
    }
  });

  // Handle incoming MLS handshake messages (commits, proposals)
  mikoto.ws.on('mlsMessages.onHandshake', async (msg) => {
    try {
      const pending = await mikoto.rest['mlsMessages.list']();
      for (const m of pending) {
        if (m.messageType === 'commit') {
          // Process commit for the associated group
          // We need the spaceId — for now use mlsGroupId as a proxy
          await mlsClient.processCommit(m.mlsGroupId, m.data);
        }
      }
    } catch (e) {
      console.error('Failed to process MLS handshake:', e);
    }
  });
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
  const [crypto, setCrypto] = useState<MlsClient | null>(null);
  const [err, setErr] = useState<AxiosError | null>(null);

  const setupMikotoClient = async (mi: MikotoClient, signal: AbortSignal) => {
    for (let attempt = 0; ; attempt++) {
      if (signal.aborted) return;

      try {
        await Promise.all([mi.spaces.list(), mi.user.load()]);
        registerNotifications(mi);

        // Initialize E2EE crypto after user is loaded
        if (mi.user.me) {
          const mlsClient = new MlsClient();
          await mlsClient.initialize(mi.user.me.id);
          await mlsClient.ensureKeyPackages(
            async () => {
              const res = await mi.rest['keyPackages.count']();
              return res.count;
            },
            async (packages) => {
              await mi.rest['keyPackages.upload']({ packages });
            },
          );
          registerMlsHandlers(mi, mlsClient);
          setCrypto(mlsClient);
        }

        setMikoto(mi);
        return;
      } catch (e) {
        const axiosErr = e as AxiosError;
        const status = axiosErr.response?.status;

        // Don't retry auth errors
        if (status === 401 || status === 403) {
          setMikoto('disconnected');
          setErr(axiosErr);
          return;
        }

        const delay = Math.min(
          BASE_DELAY_MS * 2 ** attempt + Math.random() * 500,
          MAX_DELAY_MS,
        );
        console.warn(
          `Connection attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`,
        );
        setMikoto('reconnecting');
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, delay);
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        });
      }
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const abortController = new AbortController();

      const mi = new MikotoClient({
        url: env.PUBLIC_SERVER_URL,
        auth: authClient,
      });
      setupMikotoClient(mi, abortController.signal);

      return () => {
        abortController.abort();
        mi.disconnect();
        setMikoto('disconnected');
      };
    }

    return () => {};
  }, []);

  if (err !== null) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return <Navigate to="/login" />;
    }
  }
  if (!(mikoto instanceof MikotoClient)) return fallback;

  // TODO: Connection ID key, garbage collection for event emitters
  return (
    <MikotoContext.Provider value={mikoto}>
      <CryptoProvider value={crypto}>
        <AuthContext.Provider value={authClient}>
          {children}
        </AuthContext.Provider>
      </CryptoProvider>
    </MikotoContext.Provider>
  );
}
