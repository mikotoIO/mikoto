import { Box, Button, Flex, Text } from '@chakra-ui/react';
import {
  NotificationLevel,
  NotificationPreference,
} from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { Switch } from '@/components/ui';
import {
  NotificationMode,
  getNotificationMode,
  setNotificationMode,
} from '@/functions/notify';
import { useMikoto } from '@/hooks';
import { SettingSurface } from '@/views';

const LEVEL_LABELS: Record<NotificationLevel, string> = {
  ALL: 'All Messages',
  MENTIONS: 'Mentions Only',
  NOTHING: 'Nothing',
};

const LEVEL_DESCRIPTIONS: Record<NotificationLevel, string> = {
  ALL: 'You will be notified for every new message.',
  MENTIONS: 'You will only be notified when mentioned.',
  NOTHING: 'You will not receive any notifications.',
};

const MODE_LABELS: Record<NotificationMode, string> = {
  none: 'Off',
  native: 'Native',
  toast: 'In-App',
};

const MODE_DESCRIPTIONS: Record<NotificationMode, string> = {
  none: 'Do not show push notifications.',
  native: 'Show notifications using your browser or OS notification system.',
  toast: 'Show notifications as toasts in the bottom right corner.',
};

function NotificationPermissionBanner() {
  const [permission, setPermission] = useState(Notification.permission);

  if (permission === 'granted') return null;

  return (
    <Flex
      bg="blue.900"
      p={4}
      borderRadius="8px"
      mb={4}
      align="center"
      justify="space-between"
    >
      <Box>
        <Text fontWeight="600" fontSize="14px">
          Browser notifications are {permission === 'denied' ? 'blocked' : 'not enabled'}
        </Text>
        <Text fontSize="13px" color="gray.300">
          {permission === 'denied'
            ? 'Please enable notifications in your browser settings.'
            : 'Enable browser notifications to receive alerts for new messages.'}
        </Text>
      </Box>
      {permission !== 'denied' && (
        <Button
          size="sm"
          colorPalette="blue"
          onClick={async () => {
            const result = await Notification.requestPermission();
            setPermission(result);
          }}
        >
          Enable
        </Button>
      )}
    </Flex>
  );
}

interface SpaceNotificationRowProps {
  spaceId: string;
  spaceName: string;
  level: NotificationLevel;
  onChangeLevel: (level: NotificationLevel) => void;
}

function SpaceNotificationRow({
  spaceName,
  level,
  onChangeLevel,
}: SpaceNotificationRowProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      py={3}
      px={4}
      borderRadius="6px"
      _hover={{ bg: 'gray.750' }}
    >
      <Box>
        <Text fontSize="14px" fontWeight="500">
          {spaceName}
        </Text>
        <Text fontSize="12px" color="gray.400">
          {LEVEL_DESCRIPTIONS[level]}
        </Text>
      </Box>
      <Flex gap={1}>
        {(['ALL', 'MENTIONS', 'NOTHING'] as NotificationLevel[]).map((l) => (
          <Button
            key={l}
            size="xs"
            variant={level === l ? 'solid' : 'ghost'}
            colorPalette={level === l ? 'blue' : undefined}
            onClick={() => onChangeLevel(l)}
          >
            {LEVEL_LABELS[l]}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}

export function NotificationSurface() {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);

  const [mode, setMode] = useState<NotificationMode>(getNotificationMode);
  const [preferences, setPreferences] = useState<
    Map<string, NotificationLevel>
  >(new Map());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('notificationSound');
    return stored !== 'false';
  });

  useEffect(() => {
    mikoto.spaces.listNotificationPreferences().then((prefs) => {
      setPreferences(
        new Map(
          prefs.map((p: NotificationPreference) => [p.spaceId, p.level]),
        ),
      );
    });
  }, []);

  const spaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => s.type === 'NONE',
  );

  return (
    <SettingSurface>
      <h1>{t('accountSettings.notifications.title')}</h1>

      <Box mb={6}>
        <Text fontSize="14px" fontWeight="600" mb={3}>
          Notification Style
        </Text>
        <Flex gap={3}>
          {(['none', 'native', 'toast'] as NotificationMode[]).map((m) => (
            <Box
              key={m}
              flex="1"
              p={4}
              borderWidth="2px"
              borderColor={mode === m ? 'blue.500' : 'gray.700'}
              borderRadius="8px"
              cursor="pointer"
              bg={mode === m ? 'blue.500/10' : undefined}
              _hover={{ borderColor: mode === m ? 'blue.500' : 'gray.500' }}
              onClick={() => {
                setMode(m);
                setNotificationMode(m);
              }}
            >
              <Text fontSize="14px" fontWeight="600" mb={1}>
                {MODE_LABELS[m]}
              </Text>
              <Text fontSize="12px" color="gray.400">
                {MODE_DESCRIPTIONS[m]}
              </Text>
            </Box>
          ))}
        </Flex>
      </Box>

      {mode === 'native' && <NotificationPermissionBanner />}

      <Box mb={6}>
        <Flex align="center" justify="space-between" mb={2}>
          <Box>
            <Text fontSize="14px" fontWeight="600">
              Notification Sound
            </Text>
            <Text fontSize="12px" color="gray.400">
              Play a sound when receiving notifications
            </Text>
          </Box>
          <Switch
            checked={soundEnabled}
            onCheckedChange={(e) => {
              const enabled = e.checked;
              setSoundEnabled(enabled);
              localStorage.setItem(
                'notificationSound',
                enabled ? 'true' : 'false',
              );
            }}
          />
        </Flex>
      </Box>

      <Box>
        <Text fontSize="14px" fontWeight="600" mb={3}>
          Per-Space Notification Settings
        </Text>
        <Box borderWidth="1px" borderColor="gray.700" borderRadius="8px">
          {spaces.map((space) => (
            <SpaceNotificationRow
              key={space.id}
              spaceId={space.id}
              spaceName={space.name}
              level={preferences.get(space.id) ?? 'ALL'}
              onChangeLevel={async (level) => {
                setPreferences((prev) => {
                  const next = new Map(prev);
                  next.set(space.id, level);
                  return next;
                });
                await space.setNotificationPreference(level);
              }}
            />
          ))}
          {spaces.length === 0 && (
            <Text p={4} fontSize="13px" color="gray.400">
              No spaces joined yet.
            </Text>
          )}
        </Box>
      </Box>
    </SettingSurface>
  );
}
