import type {
  MikotoMember,
  MikotoRelationship,
  UserExt,
} from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { Bot, MessageSquare, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import { Avatar, hueFromId } from '@/components/atoms/Avatar';
import {
  RoleBadge,
  roleNameProps,
  sortedRoles,
} from '@/components/atoms/MessageAvatar';
import { Topo } from '@/components/atoms/Topo';
import {
  Button,
  DialogContent,
  RoleName,
  Tag,
  describeError,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

import styles from './Profile.module.css';

function useRelationshipFor(userId: string): MikotoRelationship | undefined {
  const mikoto = useMikoto();
  useSnapshot(mikoto.relationships.cache);
  return mikoto.relationships.values().find((r) => r.relationId === userId);
}

/**
 * Runs an async action, tracks its pending state, and toasts the outcome.
 * Returns [run, pendingKey].
 */
function useAction() {
  const [pending, setPending] = useState<string | null>(null);
  const run = async (
    key: string,
    fn: () => Promise<unknown>,
    messages: { success?: string; failure: string },
  ) => {
    setPending(key);
    try {
      await fn();
      if (messages.success) {
        toast({ type: 'success', title: messages.success });
      }
    } catch (err) {
      toast({
        type: 'error',
        title: messages.failure,
        description: describeError(err, { context: 'action' }).message,
      });
    } finally {
      setPending(null);
    }
  };
  return [run, pending] as const;
}

function RelationshipButtons({
  user,
  relation,
}: {
  user: UserExt;
  relation: MikotoRelationship | undefined;
}) {
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  const tabkit = useTabkit();
  const [run, pending] = useAction();

  const sendRequest = () =>
    run('send', () => mikoto.relationships.sendRequest(user.id), {
      success: `Friend request sent to ${user.name}`,
      failure: "Couldn't send the friend request",
    });

  const openDm = (rel: MikotoRelationship) =>
    run(
      'dm',
      async () => {
        const channel = await rel.openDm();
        tabkit.openTab(
          { kind: 'textChannel', key: channel.id, channelId: channel.id },
          false,
        );
        setModal(null);
      },
      { failure: `Couldn't open your conversation with ${user.name}` },
    );

  const sendButton = (
    <Button
      variant="primary"
      loading={pending === 'send'}
      onClick={sendRequest}
    >
      <UserPlus size={15} aria-hidden />
      Send friend request
    </Button>
  );

  if (!relation) return sendButton;

  switch (relation.state) {
    case 'FRIEND':
      return (
        <>
          <Button
            variant="dangerGhost"
            loading={pending === 'remove'}
            onClick={() =>
              run('remove', () => relation.remove(), {
                success: `Removed ${user.name} from your friends`,
                failure: `Couldn't remove ${user.name}`,
              })
            }
          >
            Remove friend
          </Button>
          <Button
            variant="primary"
            loading={pending === 'dm'}
            onClick={() => openDm(relation)}
          >
            <MessageSquare size={15} aria-hidden />
            Message
          </Button>
        </>
      );
    case 'OUTGOING_REQUEST':
      return <Button disabled>Friend request sent</Button>;
    case 'INCOMING_REQUEST':
      return (
        <>
          <Button
            variant="ghost"
            loading={pending === 'decline'}
            onClick={() =>
              run('decline', () => relation.decline(), {
                success: 'Friend request declined',
                failure: "Couldn't decline the friend request",
              })
            }
          >
            Decline
          </Button>
          <Button
            variant="primary"
            loading={pending === 'accept'}
            onClick={() =>
              run('accept', () => relation.accept(), {
                success: `You and ${user.name} are now friends`,
                failure: "Couldn't accept the friend request",
              })
            }
          >
            Accept request
          </Button>
        </>
      );
    case 'BLOCKED':
      return (
        <Button
          loading={pending === 'unblock'}
          onClick={() =>
            run('unblock', () => relation.unblock(), {
              success: `Unblocked ${user.name}`,
              failure: `Couldn't unblock ${user.name}`,
            })
          }
        >
          Unblock
        </Button>
      );
    default:
      return sendButton;
  }
}

export function ProfileModal({
  user,
  member,
}: {
  user: UserExt;
  /** Pass when opened from inside a space to show the member's roles. */
  member?: MikotoMember;
}) {
  const mikoto = useMikoto();
  const relation = useRelationshipFor(user.id);
  const isMe = mikoto.user.me?.id === user.id;
  const roles = sortedRoles(member);

  return (
    <DialogContent
      title={`${user.name}'s profile`}
      headerless
      footer={
        isMe ? undefined : (
          <div className={styles.actions}>
            <RelationshipButtons user={user} relation={relation} />
          </div>
        )
      }
    >
      <div className={styles.card} style={{ '--h': hueFromId(user.id) }}>
        <div className={styles.banner} aria-hidden>
          <Topo seed={hueFromId(user.id)} className={styles.topo} />
        </div>
        <div className={styles.body}>
          <span className={styles.avatarRing}>
            <Avatar
              src={user.avatar}
              userId={user.id}
              name={user.name}
              size={80}
            />
          </span>
          <h2 className={styles.name}>
            <RoleName name={user.name} {...roleNameProps(member)} />
            {user.category === 'BOT' && (
              <Tag>
                <Bot size={12} aria-hidden />
                Bot
              </Tag>
            )}
          </h2>
          {user.handle && <p className={styles.handle}>@{user.handle}</p>}

          {user.description && (
            <div className={styles.section}>
              <p className={styles.label}>About</p>
              <p className={styles.about}>{user.description}</p>
            </div>
          )}

          {roles.length > 0 && (
            <div className={styles.section}>
              <p className={styles.label}>Roles</p>
              <div className={styles.roles}>
                {roles.map((r) => (
                  <RoleBadge key={r.id} role={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
