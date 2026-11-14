import { MikotoRelationship } from '@mikoto-io/mikoto.js';
import {
  Ban,
  Check,
  MessageSquare,
  UserPlus,
  UserRoundCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio/react';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { TabName } from '@/components/tabs';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Form,
  IconButton,
  Input,
  PageTitle,
  SegmentedControl,
  cx,
  describeError,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

import styles from './FriendsSurface.module.css';

type FriendsTab = 'all' | 'pending' | 'blocked' | 'add';

/**
 * Runs a relationship action with a pending flag and a toast either way.
 * Returns [run, pending].
 */
function useRelationAction() {
  const [pending, setPending] = useState(false);
  const run = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string,
  ) => {
    setPending(true);
    try {
      await action();
      toast({ type: 'success', title: success });
    } catch (err) {
      toast({
        type: 'error',
        title: failure,
        description: describeError(err, { context: 'action' }).message,
      });
    } finally {
      setPending(false);
    }
  };
  return [run, pending] as const;
}

function RelationRow({
  relation,
  secondary,
  onActivate,
  children,
}: {
  relation: MikotoRelationship;
  secondary?: ReactNode;
  onActivate?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(styles.row, onActivate && styles.clickable)}
      onClick={onActivate}
    >
      <span className={styles.avatar} aria-hidden>
        <Avatar
          src={relation.user.avatar ?? undefined}
          userId={relation.user.id}
          size={32}
        />
      </span>
      <div className={styles.text}>
        <div className={styles.name}>{relation.user.name}</div>
        {secondary && <div className={styles.secondary}>{secondary}</div>}
      </div>
      {/* Row clicks open the DM; clicks on actions shouldn't. */}
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FriendItem({
  relation,
  onMessage,
}: {
  relation: MikotoRelationship;
  onMessage: () => void;
}) {
  const [run, pending] = useRelationAction();
  const name = relation.user.name;
  return (
    <RelationRow
      relation={relation}
      secondary={relation.user.handle ? `@${relation.user.handle}` : 'Friend'}
      onActivate={onMessage}
    >
      <IconButton aria-label={`Message ${name}`} onClick={onMessage}>
        <MessageSquare size={16} />
      </IconButton>
      <IconButton
        aria-label={`Remove ${name} from friends`}
        className={styles.quiet}
        disabled={pending}
        onClick={() =>
          run(
            () => relation.remove(),
            `Removed ${name} from friends`,
            `Couldn't remove ${name}`,
          )
        }
      >
        <UserX size={16} />
      </IconButton>
    </RelationRow>
  );
}

function PendingItem({ relation }: { relation: MikotoRelationship }) {
  const [run, pending] = useRelationAction();
  const isIncoming = relation.state === 'INCOMING_REQUEST';
  const name = relation.user.name;

  return (
    <RelationRow
      relation={relation}
      secondary={
        isIncoming ? 'Wants to be your friend' : 'Waiting for them to accept'
      }
    >
      {isIncoming ? (
        <>
          <Button
            size="sm"
            variant="primary"
            disabled={pending}
            onClick={() =>
              run(
                () => relation.accept(),
                `You and ${name} are now friends`,
                `Couldn't accept ${name}'s request`,
              )
            }
          >
            <Check size={14} aria-hidden />
            Accept
          </Button>
          <IconButton
            aria-label={`Decline ${name}'s request`}
            disabled={pending}
            onClick={() =>
              run(
                () => relation.decline(),
                'Friend request declined',
                `Couldn't decline ${name}'s request`,
              )
            }
          >
            <X size={16} />
          </IconButton>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(
              () => relation.remove(),
              'Friend request canceled',
              "Couldn't cancel the request",
            )
          }
        >
          Cancel request
        </Button>
      )}
    </RelationRow>
  );
}

function BlockedItem({ relation }: { relation: MikotoRelationship }) {
  const [run, pending] = useRelationAction();
  const name = relation.user.name;
  return (
    <RelationRow relation={relation} secondary="Blocked">
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          run(
            () => relation.unblock(),
            `Unblocked ${name}`,
            `Couldn't unblock ${name}`,
          )
        }
      >
        Unblock
      </Button>
    </RelationRow>
  );
}

function AddFriend() {
  const mikoto = useMikoto();
  const form = useForm({ defaultValues: { userId: '' } });
  const { errors, isSubmitting } = form.formState;

  return (
    <Form
      onSubmit={form.handleSubmit(async (data) => {
        try {
          await mikoto.relationships.sendRequest(data.userId.trim());
          form.reset();
          toast({ type: 'success', title: 'Friend request sent' });
        } catch (err) {
          form.setError('userId', {
            message: `Couldn't send the request. ${describeError(err, { context: 'action' }).message}`,
          });
        }
      })}
    >
      <Field
        label="Add a friend"
        description="Enter their user ID. They'll get a request they can accept."
        error={errors.userId?.message}
      >
        <div className={styles.addRow}>
          <Input
            autoComplete="off"
            spellCheck={false}
            placeholder="User ID"
            {...form.register('userId', {
              validate: (v) =>
                v.trim().length > 0 || 'Enter a user ID to send a request.',
            })}
          />
          <Button type="submit" variant="primary" loading={isSubmitting}>
            <UserPlus size={14} aria-hidden />
            Send friend request
          </Button>
        </div>
      </Field>
    </Form>
  );
}

function TabLabel({ label, count }: { label: string; count?: number }) {
  return (
    <span className={styles.tabLabel}>
      {label}
      {count !== undefined && count > 0 && (
        <span className={styles.count}>{count}</span>
      )}
    </span>
  );
}

export function FriendsSurface() {
  const [activeTab, setActiveTab] = useState<FriendsTab>('all');
  const mikoto = useMikoto();
  const tabkit = useTabkit();

  useSnapshot(mikoto.relationships.cache);

  const friends = mikoto.relationships.friends;
  const pending = mikoto.relationships.pending;
  const blocked = mikoto.relationships.blocked;
  const incoming = pending.filter((r) => r.state === 'INCOMING_REQUEST');
  const outgoing = pending.filter((r) => r.state === 'OUTGOING_REQUEST');

  const handleOpenDm = async (relation: MikotoRelationship) => {
    try {
      const channel = await relation.openDm();
      tabkit.openTab(
        {
          kind: 'textChannel',
          key: channel.id,
          channelId: channel.id,
        },
        false,
      );
    } catch (err) {
      toast({
        type: 'error',
        title: `Couldn't open your conversation with ${relation.user.name}`,
        description: describeError(err, { context: 'action' }).message,
      });
    }
  };

  const tabs = [
    { value: 'all', label: <TabLabel label="All" count={friends.length} /> },
    {
      value: 'pending',
      label: (
        <span className={styles.tabLabel}>
          Pending
          <Badge count={incoming.length} />
        </span>
      ),
    },
    { value: 'blocked', label: <TabLabel label="Blocked" /> },
    { value: 'add', label: <TabLabel label="Add friend" /> },
  ] as const;

  const addFriendAction = (
    <Button variant="primary" onClick={() => setActiveTab('add')}>
      <UserPlus size={14} aria-hidden />
      Add friend
    </Button>
  );

  return (
    <Surface padded scroll>
      <TabName name="Friends" icon={Users} />
      <div className={styles.page}>
        <PageTitle title="Friends" />
        <SegmentedControl
          aria-label="Show"
          className={styles.tabs}
          value={activeTab}
          onValueChange={setActiveTab}
          options={tabs}
        />

        {activeTab === 'all' &&
          (friends.length === 0 ? (
            <EmptyState
              icon={<Users size={20} aria-hidden />}
              title="No friends yet"
              description="Send someone a friend request to start a direct conversation with them."
              action={addFriendAction}
            />
          ) : (
            <div className={styles.list}>
              {friends.map((rel) => (
                <FriendItem
                  key={rel.id}
                  relation={rel}
                  onMessage={() => handleOpenDm(rel)}
                />
              ))}
            </div>
          ))}

        {activeTab === 'pending' &&
          (pending.length === 0 ? (
            <EmptyState
              icon={<UserRoundCheck size={20} aria-hidden />}
              title="No pending requests"
              description="Requests you send and receive show up here until they're accepted."
              action={addFriendAction}
            />
          ) : (
            <>
              {incoming.length > 0 && (
                <>
                  <h3 className={styles.sectionLabel}>
                    Received · {incoming.length}
                  </h3>
                  <div className={styles.list}>
                    {incoming.map((rel) => (
                      <PendingItem key={rel.id} relation={rel} />
                    ))}
                  </div>
                </>
              )}
              {outgoing.length > 0 && (
                <>
                  <h3 className={styles.sectionLabel}>
                    Sent · {outgoing.length}
                  </h3>
                  <div className={styles.list}>
                    {outgoing.map((rel) => (
                      <PendingItem key={rel.id} relation={rel} />
                    ))}
                  </div>
                </>
              )}
            </>
          ))}

        {activeTab === 'blocked' &&
          (blocked.length === 0 ? (
            <EmptyState
              icon={<Ban size={20} aria-hidden />}
              title="You haven't blocked anyone"
              description="People you block show up here, where you can unblock them."
            />
          ) : (
            <div className={styles.list}>
              {blocked.map((rel) => (
                <BlockedItem key={rel.id} relation={rel} />
              ))}
            </div>
          ))}

        {activeTab === 'add' && <AddFriend />}
      </div>
    </Surface>
  );
}
