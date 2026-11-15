import type { MikotoMember, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { Bot, Crown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useSnapshot } from 'valtio';

import { contextMenuState, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import {
  MemberContextMenu,
  roleNameProps,
} from '@/components/atoms/MessageAvatar';
import { UserContextMenu } from '@/components/modals/ContextMenus';
import {
  ErrorState,
  ItemErrorBoundary,
  RegionErrorBoundary,
  RoleName,
  Skeleton,
  SkeletonGroup,
  Tag,
  useSkeletonVisible,
} from '@/design';
import { useFetchMember, useInterval, useMikoto } from '@/hooks';

import styles from './MemberListSidebar.module.css';

interface ActiveTyper {
  userId: string;
  timestamp: number;
}

function useActiveTypers(spaceId: string): Set<string> {
  const mikoto = useMikoto();
  const [typers, setTypers] = useState<ActiveTyper[]>([]);

  useEffect(() => {
    const handler = (ev: { channelId: string; userId: string }) => {
      // Only track typing for channels in this space
      const channel = mikoto.channels._get(ev.channelId);
      if (!channel || channel.spaceId !== spaceId) return;

      setTypers((prev) => {
        const next = [...prev];
        const existing = next.find((t) => t.userId === ev.userId);
        if (existing) {
          existing.timestamp = Date.now() + 5000;
        } else {
          next.push({ userId: ev.userId, timestamp: Date.now() + 5000 });
        }
        return next;
      });
    };
    mikoto.ws.on('typing.onUpdate', handler);
    return () => {
      mikoto.ws.off('typing.onUpdate', handler);
    };
  }, [spaceId]);

  useInterval(() => {
    if (typers.length === 0) return;
    setTypers((prev) => prev.filter((t) => t.timestamp > Date.now()));
  }, 500);

  return new Set(typers.map((t) => t.userId));
}

function MemberElement({
  member,
  isTyping,
}: {
  member: MikotoMember;
  isTyping?: boolean;
}) {
  const setContextMenu = useSetAtom(contextMenuState);
  const elemRef = useRef<HTMLButtonElement>(null);
  const isBot = member.user.category === 'BOT';

  const userContextMenu = useContextMenu(() => (
    <UserContextMenu user={member.user} member={member} />
  ));

  return (
    <button
      type="button"
      ref={elemRef}
      className={styles.member}
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (elemRef.current === null) return;

        const { top, left, width } = elemRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, left: left + width + 8 },
          elem: <MemberContextMenu member={member} user={member.user} />,
        });
      }}
      onContextMenu={userContextMenu}
    >
      <span className={styles.avatarWrap}>
        <Avatar
          size={28}
          src={member.user.avatar}
          userId={member.user.id}
          name={member.user.name}
          aria-hidden
        />
      </span>
      <span className={styles.text}>
        <span className={styles.nameLine}>
          <RoleName
            className={styles.name}
            name={member.user.name}
            {...roleNameProps(member)}
          />
          {member.isOwner && (
            <Crown className={styles.crown} size={13} aria-label="Owner" />
          )}
          {isBot && (
            <Tag>
              <Bot size={12} aria-hidden />
              Bot
            </Tag>
          )}
        </span>
        {isTyping && (
          <span className={styles.status}>
            <span className={styles.typing}>
              <span className={styles.pulse} aria-hidden />
              {isBot ? 'Thinking…' : 'Typing…'}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}

const SKELETON_WIDTHS = [96, 72, 110, 84, 64, 100, 78];

function MemberListSkeleton() {
  return (
    <SkeletonGroup label="members">
      <Skeleton className={styles.skeletonLabel} width={90} height={10} />
      {SKELETON_WIDTHS.map((w) => (
        <div key={w} className={styles.skeletonRow}>
          <Skeleton circle width={28} />
          <Skeleton width={w} height={11} />
        </div>
      ))}
    </SkeletonGroup>
  );
}

function GroupLabel({ context }: { context: { count: number } }) {
  return (
    <h3 className={styles.groupLabel}>
      Members <span>{context.count}</span>
    </h3>
  );
}

function MemberList({ space }: { space: MikotoSpace }) {
  const { isLoading, error } = useFetchMember(space);
  const activeTypers = useActiveTypers(space.id);
  const [retryError, setRetryError] = useState<unknown>(null);
  const [retrying, setRetrying] = useState(false);

  // Use a snapshot of the members cache to ensure reactivity
  const members = useSnapshot(space.members.cache);
  const { hasMore } = useSnapshot(space.members);
  const spaceMembers = Array.from(members.values() ?? []).toSorted((a, b) =>
    a.user.name.localeCompare(b.user.name),
  );

  const loadMore = useCallback(() => {
    if (hasMore) {
      space.members.list().catch(() => {
        // Paging failures are retried on the next scroll to the end.
      });
    }
  }, [space, hasMore]);

  const empty = spaceMembers.length === 0;
  const showSkeleton = useSkeletonVisible(empty && (isLoading || retrying));
  const failure = retryError ?? error;

  if (empty && failure && !retrying) {
    return (
      <ErrorState
        variant="region"
        what="Members"
        error={failure}
        onRetry={async () => {
          setRetrying(true);
          setRetryError(null);
          try {
            await space.members.list();
          } catch (err) {
            setRetryError(err);
          } finally {
            setRetrying(false);
          }
        }}
      />
    );
  }

  if (empty) return showSkeleton ? <MemberListSkeleton /> : null;

  return (
    <Virtuoso
      className={styles.list}
      data={spaceMembers}
      context={{ count: Math.max(space.memberCount, spaceMembers.length) }}
      components={{ Header: GroupLabel }}
      endReached={loadMore}
      computeItemKey={(_idx, member) => member.userId}
      itemContent={(_idx, member) => (
        <ItemErrorBoundary what="This member">
          <MemberElement
            member={member}
            isTyping={activeTypers.has(member.user.id)}
          />
        </ItemErrorBoundary>
      )}
    />
  );
}

export function MemberListSidebar({ space }: { space: MikotoSpace }) {
  return (
    <div className={styles.root} aria-label="Members">
      <RegionErrorBoundary what="Members" resetKeys={[space.id]}>
        <MemberList space={space} />
      </RegionErrorBoundary>
    </div>
  );
}
