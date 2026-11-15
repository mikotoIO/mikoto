import type { ConnectionState } from '@mikoto-io/mikoto.js';
import { Wifi, WifiOff } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { Button, cx, useSkeletonVisible } from '@/design';
import { useMikoto } from '@/hooks';

import styles from './MainView.module.css';

/** Don't show the banner for blips shorter than this. */
const GRACE_MS = 1500;
/** How long "Back online" stays up after recovering. */
const RECOVERED_MS = 2500;

function useConnection(): ConnectionState {
  const mikoto = useMikoto();
  const subscribe = useCallback(
    (onChange: () => void) => mikoto.onConnectionChange(onChange),
    [mikoto],
  );
  return useSyncExternalStore(subscribe, () => mikoto.connection);
}

/** Seconds until `at`, ticking once a second; null when there's no deadline. */
function useCountdown(at: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (at === null) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [at]);
  if (at === null) return null;
  return Math.max(0, Math.ceil((at - now) / 1000));
}

function isTrouble({ status, attempt }: ConnectionState) {
  return (
    status === 'reconnecting' ||
    status === 'offline' ||
    (status === 'connecting' && attempt > 0)
  );
}

/** Slim notice above the dock while live updates are interrupted. */
export function ConnectionBanner() {
  const mikoto = useMikoto();
  const connection = useConnection();
  const trouble = isTrouble(connection);
  const visible = useSkeletonVisible(trouble, {
    delay: GRACE_MS,
    minDuration: 0,
  });
  const seconds = useCountdown(trouble ? connection.nextRetryAt : null);

  // Briefly confirm recovery, but only if the user saw the problem.
  const shownRef = useRef(false);
  const [recoveredAt, setRecoveredAt] = useState<number | null>(null);
  const recovered = recoveredAt !== null;
  useEffect(() => {
    if (visible) shownRef.current = true;
  }, [visible]);
  useEffect(
    () =>
      mikoto.onConnectionChange(({ status }) => {
        if (status !== 'connected' || !shownRef.current) return;
        shownRef.current = false;
        setRecoveredAt(Date.now());
      }),
    [mikoto],
  );
  useEffect(() => {
    if (recoveredAt === null) return;
    const t = setTimeout(() => setRecoveredAt(null), RECOVERED_MS);
    return () => clearTimeout(t);
  }, [recoveredAt]);

  if (recovered && connection.status === 'connected') {
    return (
      <div className={cx(styles.banner, styles.bannerOk)} role="status">
        <Wifi size={16} aria-hidden />
        <p className={styles.bannerText}>
          <b>Back online.</b> Catching up on anything you missed.
        </p>
      </div>
    );
  }

  if (!visible || !trouble) return null;

  if (connection.status === 'offline') {
    return (
      <div className={styles.banner} role="status">
        <WifiOff size={16} aria-hidden />
        <p className={styles.bannerText}>
          <b>You're offline.</b> Mikoto will reconnect when your connection is
          back.
        </p>
        <Button size="sm" onClick={() => mikoto.reconnectNow()}>
          Try now
        </Button>
      </div>
    );
  }

  const waiting = seconds !== null;
  return (
    <div className={styles.banner} role="status">
      <WifiOff size={16} aria-hidden />
      <p className={styles.bannerText}>
        <b>Reconnecting…</b> New messages will show up once the connection is
        back.
        {waiting && (
          <span className={styles.bannerMeta}>
            {' '}
            Trying again in {seconds}s.
          </span>
        )}
      </p>
      {waiting && (
        <Button size="sm" onClick={() => mikoto.reconnectNow()}>
          Reconnect now
        </Button>
      )}
    </div>
  );
}
