import { User } from '@mikoto-io/mikoto.js';
import { atom, useAtom } from 'jotai';
import { Copy, LogOut, Settings, Smile } from 'lucide-react';
import { useEffect } from 'react';

import { Avatar } from '@/components/atoms/Avatar';
import { SetStatusModal } from '@/components/modals/Status';
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Skeleton,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useModalKit } from '@/store';
import { useTabkit } from '@/store/surface';

import styles from './UserArea.module.css';

/** The signed-in user, refreshed from the server when the user area mounts. */
export const userState = atom<User | null>(null);

function useCurrentUser(): User | null {
  const mikoto = useMikoto();
  const [user, setUser] = useAtom(userState);
  useEffect(() => {
    let cancelled = false;
    mikoto.rest['user.get']()
      .then((x) => {
        if (!cancelled) setUser(x);
      })
      .catch(() => {
        // Keep showing the user loaded at sign-in.
      });
    return () => {
      cancelled = true;
    };
  }, [mikoto, setUser]);
  return user ?? mikoto.user.me ?? null;
}

function UserAreaMenuItems({ user }: { user: User }) {
  const tabkit = useTabkit();
  const modal = useModalKit();

  return (
    <>
      <div className={styles.card}>
        <Avatar src={user.avatar ?? undefined} userId={user.id} size={40} />
        <div>
          <div className={styles.cardName}>{user.name}</div>
          {user.description && (
            <div className={styles.cardSub}>{user.description}</div>
          )}
        </div>
      </div>
      <MenuSeparator />
      <MenuItem
        icon={<Smile size={15} />}
        onClick={() => modal(<SetStatusModal />)}
      >
        Set status
      </MenuItem>
      <MenuItem
        icon={<Settings size={15} />}
        onClick={() => tabkit.openTab({ kind: 'accountSettings', key: 'accountSettings' })}
      >
        Account settings
      </MenuItem>
      <MenuItem
        icon={<Copy size={15} />}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(user.id);
            toast({ type: 'success', title: 'User ID copied' });
          } catch {
            toast({
              type: 'error',
              title: "Couldn't copy to the clipboard",
              description:
                'Allow clipboard access for this site and try again.',
            });
          }
        }}
      >
        Copy user ID
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        icon={<LogOut size={15} />}
        danger
        onClick={() => {
          localStorage.removeItem('REFRESH_TOKEN');
          window.location.reload();
        }}
      >
        Log out
      </MenuItem>
    </>
  );
}

/**
 * The signed-in user at the bottom of the sidebar: avatar, name and status
 * line (opens the account menu), plus a settings shortcut.
 */
export function UserArea() {
  const tabkit = useTabkit();
  const user = useCurrentUser();

  return (
    <div className={styles.me}>
      {user ? (
        <Menu>
          <MenuTrigger
            render={
              <button
                type="button"
                className={styles.who}
                aria-label={`Account menu for ${user.name}`}
              />
            }
          >
            <span className={styles.avatar}>
              <Avatar
                src={user.avatar ?? undefined}
                userId={user.id}
                size={32}
              />
            </span>
            <span className={styles.text}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.sub}>
                {user.description || 'Set a status'}
              </span>
            </span>
          </MenuTrigger>
          <MenuContent side="top" align="start">
            <UserAreaMenuItems user={user} />
          </MenuContent>
        </Menu>
      ) : (
        <div className={styles.who} aria-hidden>
          <Skeleton circle width={32} />
          <span className={styles.text}>
            <Skeleton width={90} height={11} />
          </span>
        </div>
      )}
      <IconButton
        aria-label="Account settings"
        onClick={() => tabkit.openTab({ kind: 'accountSettings', key: 'accountSettings' })}
      >
        <Settings size={16} aria-hidden />
      </IconButton>
    </div>
  );
}

/** @deprecated The top bar is gone; use `<UserArea />` in the sidebar. */
export const UserAreaAvatar = UserArea;
