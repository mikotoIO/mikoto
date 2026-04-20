import {
  faBell,
  faBellSlash,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoSpace, NotificationLevel } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useSnapshot } from 'valtio/react';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { InviteModal } from '@/components/modals/Invite';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import {
  notificationPreferenceStore,
  setSpaceNotificationLevel,
} from '@/store/unreads';
import { useTabkit } from '@/store/surface';

const NOTIFICATION_OPTIONS: {
  level: NotificationLevel;
  label: string;
  icon: typeof faBell;
}[] = [
  { level: 'ALL', label: 'All Messages', icon: faBell },
  { level: 'MENTIONS', label: 'Mentions Only', icon: faVolumeHigh },
  { level: 'NOTHING', label: 'Mute', icon: faBellSlash },
];

export function SpaceContextMenu({ space }: { space: MikotoSpace }) {
  const tabkit = useTabkit();
  const setModal = useSetAtom(modalState);
  const { preferences } = useSnapshot(notificationPreferenceStore);
  const notifLevel: NotificationLevel = preferences[space.id] ?? 'ALL';

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () =>
          tabkit.openTab(
            {
              kind: 'spaceSettings',
              key: space.id,
              spaceId: space.id,
            },
            true,
          )
        }
      >
        Space Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => await navigator.clipboard.writeText(space.id)}
      >
        Copy ID
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <InviteModal space={space} />,
          });
        }}
      >
        Generate Invite
      </ContextMenu.Link>
      <hr
        style={{
          margin: '4px 0',
          borderColor: 'var(--chakra-colors-gray-600)',
        }}
      />
      {NOTIFICATION_OPTIONS.map((opt) => (
        <ContextMenu.Link
          key={opt.level}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: notifLevel === opt.level ? '600' : undefined,
            color:
              notifLevel === opt.level
                ? 'var(--chakra-colors-blue-300)'
                : undefined,
          }}
          onClick={async () => {
            setSpaceNotificationLevel(space.id, opt.level);
            await space.setNotificationPreference(opt.level);
          }}
        >
          <FontAwesomeIcon icon={opt.icon} style={{ width: '14px' }} />
          {opt.label}
        </ContextMenu.Link>
      ))}
      <hr
        style={{
          margin: '4px 0',
          borderColor: 'var(--chakra-colors-gray-600)',
        }}
      />
      <ContextMenu.Link
        onClick={async () => {
          await space.leave();
        }}
      >
        Leave Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

export function SpaceBackContextMenu() {
  const setModal = useSetAtom(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <SpaceJoinModal />,
          });
        }}
      >
        Create / Join Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}
