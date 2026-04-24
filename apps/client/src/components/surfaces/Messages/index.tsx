import { Box, Flex, Grid, Heading } from '@chakra-ui/react';
import { faArrowDown, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  MessageExt,
  MessageKey,
  MikotoChannel,
  MikotoMessage,
} from '@mikoto-io/mikoto.js';
import { useAtomValue, useSetAtom } from 'jotai';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { Skeleton, SkeletonCircle } from '@/components/ui/skeleton';
import { uploadFile } from '@/functions/fileUpload';
import { useFetchMember, useMaybeSnapshot, useMikoto } from '@/hooks';
import { CurrentSpaceContext } from '@/store';

import { DateSeparator, showDateSeparator } from './DateSeparator';
import { MessageItem, messageEditState } from './Message';
import { MessageEditor } from './MessageEditor';
import { TypingIndicator, useTyping } from './TypingIndicator';

// Simple hash to get a deterministic pseudo-random number from an index
function seededRandom(index: number) {
  const x = Math.sin(index * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function MessageSkeleton({ index }: { index: number }) {
  // Determine if "simple" (continuation) based on a pattern seeded by index
  const isSimple = index > 0 && seededRandom(index) > 0.4;
  const width = `${50 + seededRandom(index * 7 + 3) * 40}%`;

  return (
    <Flex gap="16px" px="20px" py={isSimple ? '2px' : '8px'} align="start">
      {isSimple ? (
        <Box w="40px" flexShrink={0} />
      ) : (
        <SkeletonCircle size="40px" />
      )}
      <Box flex={1}>
        {!isSimple && (
          <Flex gap="8px" mb="6px" align="center">
            <Skeleton height="14px" width="120px" />
            <Skeleton height="10px" width="60px" />
          </Flex>
        )}
        <Skeleton height="14px" width={width} />
      </Box>
    </Flex>
  );
}

function MessagesLoading() {
  return (
    <Virtuoso
      totalCount={1000}
      defaultItemHeight={48}
      style={{ flexGrow: 1, overflowX: 'hidden' }}
      itemContent={(index) => <MessageSkeleton index={index} />}
    />
  );
}

function isMessageSimple(message: MessageExt, prevMessage?: MessageExt) {
  return (
    prevMessage &&
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

function ChannelHead({
  displayName,
  isDm,
}: {
  displayName: string;
  isDm: boolean;
}) {
  return (
    <Box py={4} px={16}>
      <Heading fontSize="24px" mb={2}>
        {isDm ? (
          <>Conversation with {displayName}</>
        ) : (
          <>Welcome to #{displayName}!</>
        )}
      </Heading>
      <Box as="p" color="gray.250" m={0}>
        {isDm
          ? 'This is the start of your direct message history.'
          : 'This is the start of the channel.'}
      </Box>
    </Box>
  );
}

// Please laugh
// Meant to be a large sentinel value to mark the last message (when loaded) position
// as Virtuoso does not allow negative values
const FUNNY_NUMBER = 69_420_000;

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

  // For DM channels, resolve the display name from the relationship
  const dmRelation = !channel.spaceId
    ? mikoto.relationships.values().find((r) => r.channelId === channel.id)
    : undefined;
  const displayName = dmRelation?.user.name ?? channel.name;
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);
  const loadingOlder = useRef(false);

  const [currentTypers, setCurrentTypers] = useTyping();
  const [bottomState, setBottomState] = useState(false);
  const currentEditState = useAtomValue(messageEditState);
  const setEditState = useSetAtom(messageEditState);

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

  const typing = useCallback(
    throttle(() => {
      mikoto.ws.send('typing.start', { channelId: channel.id });
    }, 3000),
    [channel.id],
  );

  const [msgs, setMsgs] = useState<MikotoMessage[] | null>(null);
  useEffect(() => {
    channel.listMessages(50, null).then((m) => {
      setMsgs(m);
      if (m.length === 0) setTopLoaded(true);
    });
  }, [channel.id]);

  const [scrollToBottom, setScrollToBottom] = useState(false);
  useEffect(() => {
    if (virtuosoRef.current && scrollToBottom) {
      virtuosoRef.current.scrollToIndex({
        index: 'LAST',
        align: 'start',
      });
      virtuosoRef.current.autoscrollToBottom();
      setScrollToBottom(false);
    }
  });

  const createFn = (x: MessageExt) => {
    if (x.channelId !== channel.id) return;

    setMsgs((xs) => {
      if (xs === null) return null;
      setCurrentTypers((ts) => ts.filter((y) => y.userId !== x.author?.id));
      channel.ack().catch(() => {});
      setScrollToBottom(true);
      // Replace optimistic message if one exists for this user
      const optimisticIndex = xs.findIndex(
        (m) => m.pending && m.authorId === x.authorId,
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
      return xs?.map((m) => (m.id === x.id ? new MikotoMessage(x, mikoto) : m));
    });
  };

  const deleteFn = (x: MessageKey) => {
    if (x.channelId !== channel.id) return;

    setMsgs((xs) => {
      if (xs === null) return null;
      setScrollToBottom(true);
      return xs.filter((y) => y.id !== x.messageId);
    });
  };

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

  const virtuosoComponents = useMemo(
    () => ({
      Header: topLoaded
        ? () => (
            <ChannelHead displayName={displayName} isDm={!channel.spaceId} />
          )
        : () => (
            <Box py="16px">
              {Array.from({ length: 8 }, (_, i) => (
                <MessageSkeleton key={i} index={i} />
              ))}
            </Box>
          ),
    }),
    [topLoaded, channel],
  );

  return (
    <Surface key={channel.id}>
      <TabName
        name={displayName}
        icon={channel.space?.icon ?? faHashtag}
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
      <Grid templateRows="auto 24px" h="100%">
        <Flex direction="column">
          <Box position="relative" flex="1" overflow="hidden">
            {msgs === null ? (
              <MessagesLoading />
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                followOutput="auto"
                defaultItemHeight={64}
                style={{ height: '100%', overflowX: 'hidden' }}
                initialTopMostItemIndex={msgs.length - 1}
                data={msgs}
                computeItemKey={(index, msg) => msg.id}
                atBottomStateChange={(atBottom) => {
                  setBottomState(atBottom);
                }}
                atBottomThreshold={30}
                overscan={1000}
                components={virtuosoComponents}
                firstItemIndex={firstItemIndex}
                startReached={async () => {
                  if (!msgs) return;
                  if (msgs.length === 0) return;
                  if (loadingOlder.current) return;
                  loadingOlder.current = true;
                  try {
                    const m = await channel.listMessages(50, msgs[0].id);
                    if (m.length === 0) {
                      setTopLoaded(true);
                      return;
                    }
                    setFirstItemIndex((x) => x - m.length);
                    setMsgs((xs) => (xs ? [...m, ...xs] : null));
                  } finally {
                    loadingOlder.current = false;
                  }
                }}
                itemContent={(index, msg) => (
                  <>
                    {showDateSeparator(
                      msg,
                      msgs[index - firstItemIndex - 1],
                    ) && <DateSeparator date={new Date(msg.timestamp)} />}
                    <MessageItem
                      message={msg}
                      isSimple={isMessageSimple(
                        msg,
                        msgs[index - firstItemIndex - 1],
                      )}
                    />
                  </>
                )}
              />
            )}
            {!bottomState && msgs !== null && (
              <Flex
                justify="center"
                position="absolute"
                bottom="8px"
                left="0"
                right="0"
                zIndex="1"
                pointerEvents="none"
              >
                <Flex
                  as="button"
                  align="center"
                  gap="6px"
                  px="12px"
                  py="6px"
                  bg="gray.600"
                  color="white"
                  fontSize="13px"
                  fontWeight="medium"
                  cursor="pointer"
                  borderRadius="full"
                  outline="none"
                  border="none"
                  pointerEvents="auto"
                  _hover={{ bg: 'gray.500' }}
                  transition="background 0.15s"
                  onClick={() => {
                    virtuosoRef.current?.scrollToIndex({
                      index: 'LAST',
                      align: 'start',
                      behavior: 'smooth',
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faArrowDown} fontSize="11px" />
                  Jump to latest
                </Flex>
              </Flex>
            )}
          </Box>
          <MessageEditor
            placeholder={`Message #${channel.name}`}
            key={currentEditState?.id ?? 'base'}
            members={spaceMembers}
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
                await m.edit(msg);
              } else {
                // Insert optimistic message immediately
                const optimisticMsg = new MikotoMessage(
                  {
                    id: crypto.randomUUID(),
                    channelId: channel.id,
                    content: msg,
                    authorId: mikoto.user.me?.id ?? null,
                    author: mikoto.user.me ?? null,
                    timestamp: new Date().toISOString(),
                    editedTimestamp: null,
                    attachments: [],
                  },
                  mikoto,
                  true,
                );
                setMsgs((xs) => (xs ? [...xs, optimisticMsg] : null));
                setScrollToBottom(true);

                // Upload all files first
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

                await channel.sendMessage(msg, attachments).catch(() => {
                  // Remove optimistic message on failure
                  setMsgs((xs) =>
                    xs ? xs.filter((m) => m.id !== optimisticMsg.id) : null,
                  );
                });
              }
            }}
          />
        </Flex>
        <TypingIndicator typers={currentTypers} channel={channel} />
      </Grid>
    </Surface>
  );
}

export function MessageSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;

  return (
    <CurrentSpaceContext.Provider value={channel.space}>
      <RealMessageView channel={channel} />
    </CurrentSpaceContext.Provider>
  );
}
