import { NotificationLevel } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import {
  Button,
  Field,
  PageTitle,
  Section,
  SegmentedControl,
  Switch,
  cx,
  toast,
} from '@/design';
import {
  NotificationMode,
  getNotificationMode,
  setNotificationMode,
} from '@/functions/notify';
import {
  PushSupport,
  disablePush,
  enablePush,
  getPushState,
  isPushSupported,
} from '@/functions/webPush';
import { useMikoto } from '@/hooks';
import { toAppError } from '@/hooks/useErrorElement';
import {
  notificationPreferenceStore,
  setSpaceNotificationLevel,
} from '@/store/unreads';
import { SettingSurface } from '@/views';

import { ListEmpty, settingsStyles } from '../common';
import styles from './notification.module.css';

const LEVELS: { value: NotificationLevel; label: string }[] = [
  { value: 'ALL', label: 'All messages' },
  { value: 'MENTIONS', label: 'Mentions' },
  { value: 'NOTHING', label: 'Nothing' },
];

const LEVEL_DESCRIPTIONS: Record<NotificationLevel, string> = {
  ALL: 'Notifies you about every new message.',
  MENTIONS: 'Notifies you only when someone mentions you.',
  NOTHING: "You won't get notifications from this space.",
};

const MODES: { value: NotificationMode; label: string; text: string }[] = [
  { value: 'none', label: 'Off', text: "Don't show notifications." },
  {
    value: 'native',
    label: 'System',
    text: "Use your browser's or operating system's notifications.",
  },
  {
    value: 'toast',
    label: 'In app',
    text: 'Show a small pop-up in the corner of Mikoto.',
  },
];

const hasNotificationApi = () => typeof Notification !== 'undefined';

function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    hasNotificationApi() ? Notification.permission : 'denied',
  );

  if (permission === 'granted') return null;

  return (
    <div className={styles.banner} role="note">
      <div className={styles.bannerText}>
        <strong>
          Browser notifications are{' '}
          {permission === 'denied' ? 'blocked' : 'turned off'}
        </strong>
        <span>
          {permission === 'denied'
            ? 'Allow notifications for this site in your browser settings, then come back.'
            : 'Allow notifications so Mikoto can alert you about new messages.'}
        </span>
      </div>
      {permission !== 'denied' && (
        <Button
          size="sm"
          variant="primary"
          onClick={async () => {
            const result = await Notification.requestPermission();
            setPermission(result);
          }}
        >
          Allow notifications
        </Button>
      )}
    </div>
  );
}

function PushNotificationToggle() {
  const [state, setState] = useState<PushSupport>('disabled');
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();

  useEffect(() => {
    if (!supported) return;
    getPushState()
      .then(setState)
      .catch(() => setState('disabled'));
  }, [supported]);

  if (!supported) {
    return (
      <Section
        title="Push notifications"
        description="This browser doesn't support push notifications. Install Mikoto to your home screen from a supported browser to turn them on."
      >
        {null}
      </Section>
    );
  }

  const onToggle = async (checked: boolean) => {
    setBusy(true);
    try {
      if (checked) {
        const result = await enablePush();
        setState(result);
        if (result === 'blocked') {
          toast({
            title: 'Notifications are blocked',
            description:
              'Allow notifications for this site in your browser settings, then try again.',
            type: 'error',
          });
        } else if (result !== 'enabled') {
          toast({
            title: "Couldn't turn on push notifications",
            description:
              'Your browser declined the subscription. Try again later.',
            type: 'error',
          });
        }
      } else {
        await disablePush();
        setState('disabled');
      }
    } catch (e) {
      toast({
        title: "Couldn't update push notifications",
        description: toAppError(e)?.message,
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section>
      <Field
        orientation="horizontal"
        label="Push notifications"
        description={
          state === 'blocked'
            ? 'Blocked in your browser settings. Allow notifications for this site to turn this on.'
            : 'Get notified about direct messages even when Mikoto is closed.'
        }
      >
        <Switch
          checked={state === 'enabled'}
          disabled={busy || state === 'blocked'}
          onCheckedChange={onToggle}
        />
      </Field>
    </Section>
  );
}

function readSoundPref() {
  try {
    return localStorage.getItem('notificationSound') !== 'false';
  } catch {
    return true;
  }
}

export function NotificationSurface() {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);
  const { preferences } = useSnapshot(notificationPreferenceStore);

  const [mode, setMode] = useState<NotificationMode>(getNotificationMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(readSoundPref);

  const spaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => s.type === 'NONE',
  );

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.notifications.title')}
        description="Choose how Mikoto gets your attention, and how much."
      />

      <Section title="Notification style">
        <div
          className={styles.modes}
          role="radiogroup"
          aria-label="Notification style"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              className={styles.mode}
              onClick={() => {
                setMode(m.value);
                setNotificationMode(m.value);
              }}
            >
              <span className={styles.modeTitle}>{m.label}</span>
              <span className={styles.modeText}>{m.text}</span>
            </button>
          ))}
        </div>
        {mode === 'native' && <NotificationPermissionBanner />}
      </Section>

      <PushNotificationToggle />

      <Section>
        <Field
          orientation="horizontal"
          label="Notification sound"
          description="Play a sound when a notification arrives."
        >
          <Switch
            checked={soundEnabled}
            onCheckedChange={(enabled) => {
              setSoundEnabled(enabled);
              try {
                localStorage.setItem(
                  'notificationSound',
                  enabled ? 'true' : 'false',
                );
              } catch {
                // Not persisted (private mode); applies this session only.
              }
            }}
          />
        </Field>
      </Section>

      <Section
        title="Spaces"
        description="Override how much each space notifies you."
      >
        {spaces.length === 0 ? (
          <ListEmpty
            title="You haven't joined any spaces"
            description="Once you join a space, you can choose how much it notifies you here."
          />
        ) : (
          <div className={settingsStyles.list}>
            {spaces.map((space) => {
              const level = preferences[space.id] ?? 'ALL';
              return (
                <div
                  key={space.id}
                  className={cx(settingsStyles.row, styles.spaceRow)}
                >
                  <div className={settingsStyles.rowMain}>
                    <span className={settingsStyles.rowTitle}>
                      {space.name}
                    </span>
                    <span className={settingsStyles.rowMeta}>
                      {LEVEL_DESCRIPTIONS[level]}
                    </span>
                  </div>
                  <SegmentedControl
                    aria-label={`Notifications for ${space.name}`}
                    value={level}
                    options={LEVELS}
                    onValueChange={async (next) => {
                      const previous = level;
                      setSpaceNotificationLevel(space.id, next);
                      try {
                        await space.setNotificationPreference(next);
                      } catch (e) {
                        setSpaceNotificationLevel(space.id, previous);
                        toast({
                          title: `Couldn't change notifications for ${space.name}`,
                          description: toAppError(e)?.message,
                          type: 'error',
                        });
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </SettingSurface>
  );
}
