import { MikotoClient, isAuthError, retry } from '@mikoto-io/mikoto.js';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { env } from '@/env';
import { notifyFromMessage } from '@/functions/notify';
import { AuthContext, MikotoContext } from '@/hooks';
import { authClient } from '@/store/authClient';
import {
  clearDmPreview,
  dmPreviewStore,
  refreshDmPreview,
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
    if (channel?.spaceId) return;

    const existing = dmPreviewStore.previews[key.channelId];
    if (!existing || existing.messageId !== key.messageId) return;

    refreshDmPreview(mikoto, key.channelId).catch(() => {
      clearDmPreview(key.channelId);
    });
  });
}

interface MikotoClientProviderProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

type ProviderState =
  | { kind: 'loading' }
  | { kind: 'ready'; client: MikotoClient }
  | { kind: 'signedOut' };

/** Data the app needs before it can render anything useful. */
async function loadInitialData(mikoto: MikotoClient) {
  await Promise.all([mikoto.spaces.sync(), mikoto.user.load()]);
  await loadNotificationPreferences(mikoto);
}

function loadUnreadState(mikoto: MikotoClient) {
  return Promise.allSettled([
    loadAcksForAllSpaces(mikoto),
    loadAcksForDms(mikoto),
  ]);
}

/**
 * Creates the client, loads initial data (retrying transient failures with
 * backoff), and keeps it in sync across reconnects. Live-connection retries
 * are handled inside mikoto.js; this only reacts to the outcome.
 */
export function MikotoClientProvider({
  children,
  fallback,
}: MikotoClientProviderProps) {
  const [state, setState] = useState<ProviderState>({ kind: 'loading' });

  // Each run owns its client and disposes it in cleanup, so Strict Mode's
  // double-invoke in development just creates and discards one extra.
  useEffect(() => {
    const abort = new AbortController();
    const mikoto = new MikotoClient({
      url: env.PUBLIC_SERVER_URL,
      auth: authClient,
    });

    const unsubscribers = [
      // Credentials rejected mid-session (e.g. refresh token revoked).
      mikoto.onConnectionChange(({ status }) => {
        if (status === 'unauthorized') setState({ kind: 'signedOut' });
      }),
      // Unread markers may have moved while we were disconnected.
      mikoto.onResync(() => {
        void loadUnreadState(mikoto);
      }),
    ];

    retry(() => loadInitialData(mikoto), {
      signal: abort.signal,
      maxMs: 16_000,
      shouldRetry: (error) => !isAuthError(error),
      onRetry: (error, attempt, delay) => {
        console.warn(
          `[mikoto] initial load failed (attempt ${attempt + 1}), retrying in ${Math.round(delay)}ms`,
          error,
        );
      },
    })
      .then(async () => {
        if (abort.signal.aborted) return;
        registerNotifications(mikoto);
        await loadUnreadState(mikoto);
        if (!abort.signal.aborted) setState({ kind: 'ready', client: mikoto });
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        // Only auth errors stop the retry loop.
        if (isAuthError(error)) setState({ kind: 'signedOut' });
      });

    return () => {
      abort.abort();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      mikoto.disconnect();
    };
  }, []);

  if (state.kind === 'signedOut') return <Navigate to="/login" />;
  if (state.kind !== 'ready') return fallback;

  return (
    <MikotoContext value={state.client}>
      <AuthContext value={authClient}>{children}</AuthContext>
    </MikotoContext>
  );
}
