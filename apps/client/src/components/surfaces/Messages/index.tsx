import {
  type MessageExt,
  type MessageKey,
  type MikotoChannel,
  MikotoMessage,
  type ReactionEvent,
} from '@mikoto-io/mikoto.js';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import throttle from 'lodash/throttle';
import { ArrowDown, Hash, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { CustomEmojiProvider } from '@/components/molecules/markdown';
import { TabName } from '@/components/tabs';
import {
  DelayedFallback,
  EmptyState,
  ErrorState,
  IconButton,
  PaneHeader,
  RegionErrorBoundary,
  SkeletonGroup,
  describeError,
  toast,
} from '@/design';
import { uploadFile } from '@/functions/fileUpload';
import { useFetchMember, useMaybeSnapshot, useMikoto } from '@/hooks';
import { CurrentSpaceContext, explorerPanelsState } from '@/store';

import { DateSeparator, showDateSeparator } from './DateSeparator';
import { MessageItem, MessageSkeleton, messageEditState } from './Message';
import { type FileUpload, MessageEditor } from './MessageEditor';
import styles from './Messages.module.css';
import { TypingIndicator, useTyping } from './TypingIndicator';

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const PAGE_SIZE = 50;

const time = (m: MikotoMessage) => new Date(m.timestamp).getTime();

/**
 * Fold a freshly fetched newest page into the loaded list. History above the
 * page is kept, server state wins inside it (catching missed edits and
 * deletes), and local unsent messages stay at the end. If the page doesn't
 * reach back to what we already had, the gap can't be stitched, so the page
 * replaces the list and older history reloads on scroll.
 */
function mergeLatestPage(
  current: MikotoMessage[] | null,
  latest: MikotoMessage[],
): MikotoMessage[] {
  const local = (current ?? []).filter((m) => m.pending);
  const loaded = (current ?? []).filter((m) => !m.pending);
  if (latest.length === 0) return local;

  const pageStart = time(latest[0]);
  const newestLoaded = loaded.length ? time(loaded[loaded.length - 1]) : -1;
  const hasGap = latest.length >= PAGE_SIZE && pageStart > newestLoaded;
  if (hasGap) return [...latest, ...local];

  const older = loaded.filter((m) => time(m) < pageStart);
  const latestIds = new Set(latest.map((m) => m.id));
  return [...older.filter((m) => !latestIds.has(m.id)), ...latest, ...local];
}

function isMessageSimple(message: MikotoMessage, prevMessage?: MikotoMessage) {
  if (!prevMessage) return false;
  if (prevMessage.pending || message.pending) return false;
  if (showDateSeparator(message, prevMessage)) return false;
  return (
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      GROUP_WINDOW_MS
  );
}

function MessagesSkeleton() {
  return (
    <SkeletonGroup label="messages" className={styles.skeletonList}>
      {Array.from({ length: 8 }, (_, i) => (
        <MessageSkeleton key={i} index={i} />
      ))}
    </SkeletonGroup>
  );
}

interface ListContext {
  topLoaded: boolean;
  isDm: boolean;
  displayName: string;
  dmUser?: { id: string; name: string; avatar?: string | null };
}

/** Top of the list: the channel start once fully scrolled, else skeletons. */
function ListHeader({ context }: { context: ListContext }) {
  if (!context.topLoaded) {
    return (
      <SkeletonGroup label="older messages" className={styles.loadingOlder}>
        {[0, 1, 2].map((i) => (
          <MessageSkeleton key={i} index={i + 3} />
        ))}
      </SkeletonGroup>
    );
  }
  if (context.isDm) {
    return (
      <div className={styles.start}>
        <div className={styles.startAvatar}>
          <Avatar
            src={context.dmUser?.avatar}
            userId={context.dmUser?.id}
            name={context.displayName}
            size={56}
          />
        </div>
        <h2>{context.displayName}</h2>
        <p>
          This is the start of your conversation with {context.displayName}.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.start}>
      <div className={styles.startIcon}>
        <Hash size={24} aria-hidden />
      </div>
      <h2>Welcome to #{context.displayName}</h2>
      <p>This is the start of the #{context.displayName} channel.</p>
    </div>
  );
}

function ListFooter() {
  return <div className={styles.footer} />;
}

// Please laugh
// Meant to be a large sentinel value to mark the last message (when loaded) position
// as Virtuoso does not allow negative values
const FUNNY_NUMBER = 69_420_000;

interface FailedSend {
  content: string;
  files: FileUpload[];
}

function RealMessageView({ channel }: { channel: MikotoChannel }) {
  useFetchMember(channel.space);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  const membersCache = useMaybeSnapshot(
    channel.space?.members.cache ?? new Map(),
  );
  const spaceMembers = useMemo(
    () => Array.from(membersCache.values()),
    [membersCache],
  );
  const [panels, setPanels] = useAtom(explorerPanelsState);

  const isDm = !channel.spaceId;
  // For DM channels, resolve the display name from the relationship
  const dmRelation = isDm
    ? mikoto.relationships.values().find((r) => r.channelId === channel.id)
    : undefined;
  const displayName = dmRelation?.user.name ?? channel.name;
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);
  const loadingOlderRef = useRef(false);

  const [currentTypers, setCurrentTypers] = useTyping();
  const [bottomState, setBottomState] = useState(true);
  const currentEditState = useAtomValue(messageEditState);
  const setEditState = useSetAtom(messageEditState);

  // Optimistic messages whose send failed, by id, with what to resend.
  const [failedSends, setFailedSends] = useState<Record<string, FailedSend>>(
    {},
  );
  const failedRef = useRef(new Set<string>());

  useEffect(() => {
    const handler = (ev: { channelId: string; userId: string }) => {
      if (ev.channelId !== channel.id) return;
      if (ev.userId === mikoto.user.me?.id) return;

      setCurrentTypers((cts) => {
        const ct = [...cts];
        let exists = false;
        ct.forEach((x) => {
          if (x.userId === ev.userId) {
            exists = true;
            x.timestamp = Date.now() + 5000;
          }
        });
        if (!exists) {
          ct.push({
            timestamp: Date.now() + 5000,
            userId: ev.userId,
          });
        }
        return ct;
      });
    };
    mikoto.ws.on('typing.onUpdate', handler);
    return () => {
      mikoto.ws.off('typing.onUpdate', handler);
    };
  }, [channel.id]);

  const typing = useMemo(
    () =>
      throttle(() => {
        mikoto.ws.send('typing.start', { channelId: channel.id });
      }, 3000),
    [channel.id],
  );

  const [msgs, setMsgs] = useState<MikotoMessage[] | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    channel
      .listMessages(PAGE_SIZE, null)
      .then((m) => {
        if (cancelled) return;
        setMsgs(m);
        if (m.length === 0) setTopLoaded(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [channel.id, loadAttempt]);

  const retryLoad = () => {
    setLoadError(null);
    setLoadAttempt((n) => n + 1);
  };

  // After a reconnect, fetch the newest page and fold in anything missed
  // while the connection was down.
  useEffect(
    () =>
      mikoto.onResync(() => {
        channel
          .listMessages(PAGE_SIZE, null)
          .then((latest) => {
            setMsgs((xs) => mergeLatestPage(xs, latest));
            // A full page may have replaced the list; older history exists.
            if (latest.length >= PAGE_SIZE) setTopLoaded(false);
          })
          .catch(() => {
            // Live events resume regardless; the next resync tries again.
          });
      }),
    [channel.id],
  );

  const [scrollToBottom, setScrollToBottom] = useState(false);
  useEffect(() => {
    if (virtuosoRef.current && scrollToBottom) {
      virtuosoRef.current.scrollToIndex({
        index: 'LAST',
        align: 'start',
      });
      virtuosoRef.current.autoscrollToBottom();
      // Reset the trigger flag after performing the scroll. Self-resetting
      // boolean flag pattern — the effect only runs again when flipped back.
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setScrollToBottom(false);
    }
  });

  const createFn = (x: MessageExt) => {
    if (x.channelId !== channel.id) return;
    setCurrentTypers((ts) => ts.filter((y) => y.userId !== x.author?.id));
    channel.ack().catch(() => {});
    setScrollToBottom(true);

    setMsgs((xs) => {
      if (xs === null) return null;
      // Replace this user's oldest in-flight optimistic message, if any.
      // Failed ones stay put until the user retries or deletes them.
      const optimisticIndex = xs.findIndex(
        (m) =>
          m.pending &&
          m.authorId === x.authorId &&
          !failedRef.current.has(m.id),
      );
      if (optimisticIndex !== -1) {
        const updated = [...xs];
        updated[optimisticIndex] = new MikotoMessage(x, mikoto);
        return updated;
      }
      return [...xs, new MikotoMessage(x, mikoto)];
    });
  };

  const updateFn = (x: MessageExt) => {
    if (x.channelId !== channel.id) return;
    setMsgs((xs) => {
      if (xs === null) return null;
      return xs.map((m) => (m.id === x.id ? new MikotoMessage(x, mikoto) : m));
    });
  };

  const deleteFn = (x: MessageKey) => {
    if (x.channelId !== channel.id) return;
    setScrollToBottom(true);
    setMsgs((xs) => {
      if (xs === null) return null;
      return xs.filter((y) => y.id !== x.messageId);
    });
  };

  // Messages are valtio proxies, so reacting mutates them in place. Our own
  // reactions were already applied optimistically; applying is idempotent.
  const reactionFn = (added: boolean) => (x: ReactionEvent) => {
    if (x.channelId !== channel.id) return;
    msgsRef.current
      ?.find((m) => m.id === x.messageId)
      ?._applyReaction(x, added);
  };

  useEffect(() => {
    const onReactionAdd = reactionFn(true);
    const onReactionRemove = reactionFn(false);
    mikoto.ws.on('messages.onReactionAdd', onReactionAdd);
    mikoto.ws.on('messages.onReactionRemove', onReactionRemove);
    return () => {
      mikoto.ws.off('messages.onReactionAdd', onReactionAdd);
      mikoto.ws.off('messages.onReactionRemove', onReactionRemove);
    };
  }, [channel.id]);

  useEffect(() => {
    mikoto.ws.on('messages.onCreate', createFn);
    mikoto.ws.on('messages.onUpdate', updateFn);
    mikoto.ws.on('messages.onDelete', deleteFn);
    return () => {
      mikoto.ws.off('messages.onCreate', createFn);
      mikoto.ws.off('messages.onUpdate', updateFn);
      mikoto.ws.off('messages.onDelete', deleteFn);
    };
  }, [channel.id]);

  const markFailed = (id: string, failed: FailedSend | null) => {
    if (failed) failedRef.current.add(id);
    else failedRef.current.delete(id);
    setFailedSends((prev) => {
      const next = { ...prev };
      if (failed) next[id] = failed;
      else delete next[id];
      return next;
    });
  };

  /** Uploads files, then sends. On failure the message stays, marked "Not sent". */
  const deliver = async (
    optimisticId: string,
    content: string,
    files: FileUpload[],
  ) => {
    try {
      const attachments = await Promise.all(
        files.map(async ({ file }) => {
          const response = await uploadFile('/attachment', file);
          return {
            url: response.data.url,
            filename: file.name,
            contentType: file.type,
            size: file.size,
          };
        }),
      );
      await channel.sendMessage(content, attachments);
    } catch {
      markFailed(optimisticId, { content, files });
    }
  };

  const sendNew = (content: string, files: FileUpload[]) => {
    // Insert optimistic message immediately
    const optimisticMsg = new MikotoMessage(
      {
        id: crypto.randomUUID(),
        channelId: channel.id,
        content,
        authorId: mikoto.user.me?.id ?? null,
        author: mikoto.user.me ?? null,
        timestamp: new Date().toISOString(),
        editedTimestamp: null,
        attachments: [],
        reactions: [],
      },
      mikoto,
      true,
    );
    setMsgs((xs) => (xs ? [...xs, optimisticMsg] : xs));
    setScrollToBottom(true);
    return deliver(optimisticMsg.id, content, files);
  };

  const retrySend = (id: string) => {
    const failed = failedSends[id];
    if (!failed) return;
    markFailed(id, null);
    void deliver(id, failed.content, failed.files);
  };

  const discardSend = (id: string) => {
    markFailed(id, null);
    setMsgs((xs) => (xs ? xs.filter((m) => m.id !== id) : xs));
  };

  const scrollToLatest = () => {
    virtuosoRef.current?.scrollToIndex({
      index: 'LAST',
      align: 'start',
      behavior: 'smooth',
    });
  };

  const listContext: ListContext = {
    topLoaded,
    isDm,
    displayName,
    dmUser: dmRelation?.user,
  };

  return (
    <Surface key={channel.id}>
      <TabName
        name={displayName}
        icon={
          isDm && dmRelation
            ? (dmRelation.user.avatar ?? `default-avatar/${dmRelation.user.id}`)
            : (channel.space?.icon ?? Hash)
        }
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
      <PaneHeader
        icon={
          isDm ? (
            <Avatar
              src={dmRelation?.user.avatar}
              userId={dmRelation?.user.id}
              name={displayName}
              size={20}
            />
          ) : (
            <Hash size={18} aria-hidden />
          )
        }
        title={displayName}
        actions={
          !isDm && (
            <IconButton
              aria-label={
                panels.membersCollapsed ? 'Show members' : 'Hide members'
              }
              aria-pressed={!panels.membersCollapsed}
              onClick={() =>
                setPanels((p) => ({
                  ...p,
                  membersCollapsed: !p.membersCollapsed,
                }))
              }
            >
              <Users size={16} />
            </IconButton>
          )
        }
      />
      <div className={styles.chat}>
        <div className={styles.list}>
          {loadError !== null && msgs === null ? (
            <ErrorState
              what={isDm ? 'This conversation' : `#${channel.name}`}
              error={loadError}
              onRetry={retryLoad}
            />
          ) : msgs === null ? (
            <DelayedFallback>
              <MessagesSkeleton />
            </DelayedFallback>
          ) : (
            <Virtuoso<MikotoMessage, ListContext>
              ref={virtuosoRef}
              className={styles.scroller}
              followOutput="auto"
              defaultItemHeight={64}
              initialTopMostItemIndex={Math.max(0, msgs.length - 1)}
              data={msgs}
              context={listContext}
              computeItemKey={(_, msg) => msg.id}
              atBottomStateChange={setBottomState}
              atBottomThreshold={30}
              overscan={1000}
              components={{ Header: ListHeader, Footer: ListFooter }}
              firstItemIndex={firstItemIndex}
              startReached={async () => {
                if (!msgs || msgs.length === 0) return;
                if (topLoaded || loadingOlderRef.current) return;
                const oldest = msgs.find((m) => !m.pending);
                if (!oldest) return;
                loadingOlderRef.current = true;
                try {
                  const m = await channel.listMessages(PAGE_SIZE, oldest.id);
                  if (m.length === 0) {
                    setTopLoaded(true);
                    return;
                  }
                  setFirstItemIndex((x) => x - m.length);
                  setMsgs((xs) => (xs ? [...m, ...xs] : null));
                } catch (err) {
                  toast({
                    type: 'error',
                    title: "Couldn't load older messages",
                    description: describeError(err, { context: 'action' })
                      .message,
                  });
                } finally {
                  loadingOlderRef.current = false;
                }
              }}
              itemContent={(index, msg) => {
                const prev = msgs[index - firstItemIndex - 1];
                return (
                  <>
                    {showDateSeparator(msg, prev) && (
                      <DateSeparator date={new Date(msg.timestamp)} />
                    )}
                    <MessageItem
                      message={msg}
                      isSimple={isMessageSimple(msg, prev)}
                      inSpace={!isDm}
                      failed={msg.id in failedSends}
                      onRetry={() => retrySend(msg.id)}
                      onDiscard={() => discardSend(msg.id)}
                    />
                  </>
                );
              }}
            />
          )}
          {!bottomState && msgs !== null && (
            <div className={styles.jumpWrap}>
              <button
                type="button"
                className={styles.jump}
                onClick={scrollToLatest}
              >
                <ArrowDown size={14} aria-hidden />
                Jump to latest
              </button>
            </div>
          )}
        </div>
        <RegionErrorBoundary
          what="The message box"
          resetKeys={[channel.id]}
          className={styles.composerError}
        >
          <MessageEditor
            placeholder={
              isDm ? `Message ${displayName}` : `Message #${channel.name}`
            }
            key={currentEditState?.id ?? 'base'}
            members={spaceMembers}
            above={<TypingIndicator typers={currentTypers} channel={channel} />}
            onTyping={() => {
              typing();
            }}
            onResize={() => {
              if (bottomState && virtuosoRef.current) {
                virtuosoRef.current.scrollToIndex({
                  index: 'LAST',
                  align: 'start',
                });
                virtuosoRef.current.autoscrollToBottom();
              }
            }}
            onSubmit={async (msg, files) => {
              typing.cancel();
              if (currentEditState) {
                const m = currentEditState;
                setEditState(null);
                try {
                  await m.edit(msg);
                } catch (err) {
                  toast({
                    type: 'error',
                    title: "Couldn't save your edit",
                    description: describeError(err, { context: 'action' })
                      .message,
                  });
                }
              } else {
                await sendNew(msg, files);
              }
            }}
          />
        </RegionErrorBoundary>
      </div>
    </Surface>
  );
}

export function MessageSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId);

  if (!channel) {
    return (
      <Surface>
        <EmptyState
          icon={<Hash size={20} aria-hidden />}
          title="This channel isn't available"
          description="It may have been deleted, or you may no longer have access. Close this tab or pick another channel."
        />
      </Surface>
    );
  }

  return (
    <CurrentSpaceContext value={channel.space}>
      <CustomEmojiProvider space={channel.space}>
        <RealMessageView channel={channel} />
      </CustomEmojiProvider>
    </CurrentSpaceContext>
  );
}
