import { MikotoClient } from '@mikoto-io/mikoto.js';
import { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '@/env';
import { notifyFromMessage } from '@/functions/notify';
import { AuthContext, MikotoContext } from '@/hooks';
import { authClient } from '@/store/authClient';
import {
  clearDmPreview,
  setDmPreview,
  updateDmPreview,
} from '@/store/dmPreviews';
import {
  ackChannel,
  getSpaceNotificationLevel,
  loadAcksForAllSpaces,
  loadAcksForDms,
  loadNotificationPreferences,
} from '@/store/unreads';

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;

function registerNotifications(mikoto: MikotoClient) {
  mikoto.ws.on('messages.onCreate', (msg) => {
    const channel = mikoto.channels._get(msg.channelId);
    if (channel) channel.lastUpdated = msg.timestamp;

    if (!channel?.spaceId) {
      setDmPreview(msg.channelId, msg);
    }

    if (msg.authorId === mikoto.user.me?.id) {
      ackChannel(msg.channelId, msg.timestamp);
      return;
    }
    if (!channel) return;

    if (channel.spaceId) {
      const pref = getSpaceNotificationLevel(channel.spaceId);
      if (pref === 'NOTHING') return;
      if (pref === 'MENTIONS') return;
    }

    const isViewingChannel = notifyFromMessage(mikoto, msg);
    if (isViewingChannel) {
      channel.ack();
      ackChannel(msg.channelId, msg.timestamp);
    }
  });

  mikoto.ws.on('messages.onUpdate', (msg) => {
    const channel = mikoto.channels._get(msg.channelId);
    if (!channel?.spaceId) {
      updateDmPreview(msg.channelId, msg);
    }
  });

  mikoto.ws.on('messages.onDelete', (key) => {
    const channel = mikoto.channels._get(key.channelId);
    if (!channel?.spaceId) {
      clearDmPreview(key.channelId);
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
  const [err, setErr] = useState<AxiosError | null>(null);

  const setupMikotoClient = async (mi: MikotoClient, signal: AbortSignal) => {
    for (let attempt = 0; ; attempt++) {
      if (signal.aborted) return;

      try {
        await Promise.all([mi.spaces.list(), mi.user.load()]);
        await loadNotificationPreferences(mi);
        registerNotifications(mi);
        await Promise.allSettled([
          loadAcksForAllSpaces(mi),
          loadAcksForDms(mi),
        ]);
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
      <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>
    </MikotoContext.Provider>
  );
}
