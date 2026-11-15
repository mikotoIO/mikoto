import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { Command } from 'cmdk';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Search } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { useSnapshot } from 'valtio/react';

import { Avatar } from '@/components/atoms/Avatar';
import { SpaceIcon } from '@/components/atoms/SpaceIcon';
import {
  channelKindLabel,
  getIconFromChannelType,
  tryChannelToTab,
} from '@/components/surfaces/Explorer/channelToTab';
import { Kbd, describeError, toast } from '@/design';
import { useMikoto } from '@/hooks';
import { treebarSpaceState } from '@/store';
import { useTabkit } from '@/store/surface';

import styles from './CommandMenu.module.css';

export const commandMenuOpenAtom = atom(false);

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.userAgent);

function Item({
  value,
  keywords,
  icon,
  label,
  meta,
  onSelect,
}: {
  value: string;
  keywords: string[];
  icon: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      className={styles.item}
      value={value}
      keywords={keywords}
      onSelect={onSelect}
    >
      <span className={styles.itemIcon}>{icon}</span>
      <span className={styles.itemLabel}>{label}</span>
      {meta && <span className={styles.itemMeta}>{meta}</span>}
    </Command.Item>
  );
}

/** The global launcher (Ctrl/⌘ K): jump to a space, channel or DM. */
export function CommandMenuKit() {
  const [open, setOpen] = useAtom(commandMenuOpenAtom);
  const mikoto = useMikoto();
  const setLeftSidebar = useSetAtom(treebarSpaceState);
  const tabkit = useTabkit();

  // Subscribe to spaces and relationships for reactivity
  useSnapshot(mikoto.spaces);
  useSnapshot(mikoto.relationships.cache);

  const spaces = Array.from(mikoto.spaces.cache.values()).filter(
    (space) => space.type === 'NONE',
  );
  const dmFriends = mikoto.relationships.friends.filter((f) => f.channelId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const navigateToSpace = (spaceId: string) => {
    setLeftSidebar({
      kind: 'explorer',
      key: `explorer/${spaceId}`,
      spaceId,
    });
    setOpen(false);
  };

  const openChannel = (spaceId: string, channel: MikotoChannel) => {
    const tab = tryChannelToTab(channel);
    setOpen(false);
    if (!tab) {
      toast({
        type: 'error',
        title: `Couldn't open #${channel.name}`,
        description:
          "This channel type isn't supported by this version of Mikoto. Reload to update.",
      });
      return;
    }
    setLeftSidebar({
      kind: 'explorer',
      key: `explorer/${spaceId}`,
      spaceId,
    });
    tabkit.openTab(tab, tabkit.getTabs().length > 0);
  };

  const openDm = async (friend: (typeof dmFriends)[number]) => {
    setOpen(false);
    try {
      const channel = await friend.openDm();
      setLeftSidebar(null);
      tabkit.openTab(
        { kind: 'textChannel', key: channel.id, channelId: channel.id },
        tabkit.getTabs().length > 0,
      );
    } catch (err) {
      toast({
        type: 'error',
        title: `Couldn't open your conversation with ${friend.user.name}`,
        description: describeError(err, { context: 'action' }).message,
      });
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Jump to a channel, space or person"
      overlayClassName={styles.overlay}
      contentClassName={styles.content}
      className={styles.command}
      loop
    >
      <div className={styles.box}>
        <Search size={18} aria-hidden />
        <Command.Input
          className={styles.input}
          placeholder="Jump to a channel, space or person"
        />
        <Kbd>{IS_MAC ? '⌘ K' : 'Ctrl K'}</Kbd>
      </div>
      <Command.List className={styles.list}>
        <Command.Empty className={styles.empty}>
          Nothing matches. Try a channel, space or person's name.
        </Command.Empty>

        {dmFriends.length > 0 && (
          <Command.Group heading="Direct messages" className={styles.group}>
            {dmFriends.map((friend) => (
              <Item
                key={friend.id}
                value={`dm-${friend.id}`}
                keywords={[friend.user.name]}
                icon={
                  <Avatar
                    size={18}
                    src={friend.user.avatar ?? undefined}
                    userId={friend.user.id}
                  />
                }
                label={friend.user.name}
                meta="Direct message"
                onSelect={() => openDm(friend)}
              />
            ))}
          </Command.Group>
        )}

        {spaces.length > 0 && (
          <Command.Group heading="Spaces" className={styles.group}>
            {spaces.map((space) => (
              <Item
                key={space.id}
                value={`space-${space.id}`}
                keywords={[space.name]}
                icon={<SpaceIcon space={space} size={18} />}
                label={space.name}
                meta="Space"
                onSelect={() => navigateToSpace(space.id)}
              />
            ))}
          </Command.Group>
        )}

        {spaces.map((space) => {
          const channels = space.channels;
          if (channels.length === 0) return null;
          return (
            <Command.Group
              key={space.id}
              heading={space.name}
              className={styles.group}
            >
              {channels.map((channel) => {
                const Icon = getIconFromChannelType(channel.type);
                return (
                  <Item
                    key={channel.id}
                    value={`channel-${channel.id}`}
                    keywords={[channel.name, space.name]}
                    icon={<Icon size={16} aria-hidden />}
                    label={channel.name}
                    meta={channelKindLabel(channel.type)}
                    onSelect={() => openChannel(space.id, channel)}
                  />
                );
              })}
            </Command.Group>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
}
