import { MikotoSpace, NotificationLevel } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import {
  AtSign,
  Bell,
  BellOff,
  CheckCheck,
  Copy,
  DoorOpen,
  Plus,
  Settings,
  UserPlus,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { useSnapshot } from 'valtio/react';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { InviteModal } from '@/components/modals/Invite';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import {
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  describeError,
  toast,
} from '@/design';
import { useTabkit } from '@/store/surface';
import {
  ackChannel,
  isChannelUnread,
  notificationPreferenceStore,
  setSpaceNotificationLevel,
} from '@/store/unreads';

const ICON = 15;

const NOTIFICATION_OPTIONS: {
  level: NotificationLevel;
  label: string;
  icon: ReactNode;
}[] = [
  { level: 'ALL', label: 'All messages', icon: <Bell size={ICON} /> },
  { level: 'MENTIONS', label: 'Only mentions', icon: <AtSign size={ICON} /> },
  { level: 'NOTHING', label: 'Mute space', icon: <BellOff size={ICON} /> },
];

export interface SpaceAction {
  id: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  /** Shows a check on the right (current notification level). */
  checked?: boolean;
  onSelect: () => void;
}

export interface SpaceActionGroup {
  id: string;
  label?: string;
  actions: SpaceAction[];
}

/**
 * Everything you can do to a space, grouped. Rendered both as the
 * right-click menu and as the banner's dropdown, so they never drift apart.
 */
export function useSpaceActions(space: MikotoSpace): SpaceActionGroup[] {
  const tabkit = useTabkit();
  const setModal = useSetAtom(modalState);
  const { preferences } = useSnapshot(notificationPreferenceStore);
  const notifLevel: NotificationLevel = preferences[space.id] ?? 'ALL';

  return [
    {
      id: 'main',
      actions: [
        {
          id: 'invite',
          label: 'Invite people',
          icon: <UserPlus size={ICON} />,
          onSelect: () => setModal({ elem: <InviteModal space={space} /> }),
        },
        {
          id: 'settings',
          label: 'Space settings',
          icon: <Settings size={ICON} />,
          onSelect: () =>
            tabkit.openTab(
              { kind: 'spaceSettings', key: space.id, spaceId: space.id },
              true,
            ),
        },
        {
          id: 'read',
          label: 'Mark all as read',
          icon: <CheckCheck size={ICON} />,
          onSelect: async () => {
            const now = new Date().toISOString();
            const results = await Promise.allSettled(
              space.channels
                .filter((ch) => isChannelUnread(ch.lastUpdated, ch.id))
                .map(async (ch) => {
                  await ch.ack();
                  ackChannel(ch.id, now);
                }),
            );
            const failed = results.find((r) => r.status === 'rejected');
            if (failed) {
              toast({
                type: 'error',
                title: "Some channels couldn't be marked as read",
                description: describeError(failed.reason, { context: 'action' })
                  .message,
              });
            }
          },
        },
        {
          id: 'copy-id',
          label: 'Copy space ID',
          icon: <Copy size={ICON} />,
          onSelect: async () => {
            try {
              await navigator.clipboard.writeText(space.id);
              toast({ type: 'success', title: 'Space ID copied' });
            } catch {
              toast({
                type: 'error',
                title: "Couldn't copy to the clipboard",
                description:
                  'Allow clipboard access for this site and try again.',
              });
            }
          },
        },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      actions: NOTIFICATION_OPTIONS.map((opt) => ({
        id: `notify-${opt.level}`,
        label: opt.label,
        icon: opt.icon,
        checked: notifLevel === opt.level,
        onSelect: async () => {
          const previous = notifLevel;
          setSpaceNotificationLevel(space.id, opt.level);
          try {
            await space.setNotificationPreference(opt.level);
          } catch (err) {
            setSpaceNotificationLevel(space.id, previous);
            toast({
              type: 'error',
              title: "Couldn't change notifications",
              description: describeError(err, { context: 'action' }).message,
            });
          }
        },
      })),
    },
    {
      id: 'danger',
      actions: [
        {
          id: 'leave',
          label: 'Leave space',
          icon: <DoorOpen size={ICON} />,
          danger: true,
          onSelect: async () => {
            try {
              await space.leave();
              toast({ type: 'success', title: `Left ${space.name}` });
            } catch (err) {
              toast({
                type: 'error',
                title: `Couldn't leave ${space.name}`,
                description: describeError(err, { context: 'action' }).message,
              });
            }
          },
        },
      ],
    },
  ];
}

/** Right-click menu for a space icon. */
export function SpaceContextMenu({ space }: { space: MikotoSpace }) {
  const groups = useSpaceActions(space);
  return (
    <ContextMenu>
      {groups.map((group, i) => (
        <Fragment key={group.id}>
          {i > 0 && <ContextMenu.Separator />}
          {group.label && <ContextMenu.Label>{group.label}</ContextMenu.Label>}
          {group.actions.map((a) => (
            <ContextMenu.Item
              key={a.id}
              icon={a.icon}
              danger={a.danger}
              checked={a.checked}
              onClick={a.onSelect}
            >
              {a.label}
            </ContextMenu.Item>
          ))}
        </Fragment>
      ))}
    </ContextMenu>
  );
}

/** The same actions as Base UI menu items, for `<MenuContent>`. */
export function SpaceMenuItems({ space }: { space: MikotoSpace }) {
  const groups = useSpaceActions(space);
  return groups.map((group, i) => (
    <Fragment key={group.id}>
      {i > 0 && <MenuSeparator />}
      {group.label && <MenuGroupLabel>{group.label}</MenuGroupLabel>}
      {group.actions.map((a) => (
        <MenuItem
          key={a.id}
          icon={a.icon}
          danger={a.danger}
          checked={a.checked}
          onClick={a.onSelect}
        >
          {a.label}
        </MenuItem>
      ))}
    </Fragment>
  ));
}

/** Right-click menu on the empty part of the space rail. */
export function SpaceBackContextMenu() {
  const setModal = useSetAtom(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Item
        icon={<Plus size={ICON} />}
        onClick={() => {
          setModal({ elem: <SpaceJoinModal /> });
        }}
      >
        Create or join a space
      </ContextMenu.Item>
    </ContextMenu>
  );
}
