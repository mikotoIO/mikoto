import { Box, Flex, Grid, Heading } from '@chakra-ui/react';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import {
  Channel,
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
import {
  Skeleton,
  SkeletonCircle,
} from '@/components/ui/skeleton';
import { uploadFile } from '@/functions/fileUpload';
import { useFetchMember, useMikoto } from '@/hooks';
import { useCrypto } from '@/hooks/useCrypto';
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

function ChannelHead({ channel }: { channel: Channel }) {
  return (
    <Box py={4} px={16}>
      <Heading fontSize="24px" mb={2}>
        Welcome to #{channel.name}!
      </Heading>
      <Box as="p" color="gray.250" m={0}>
        This is the start of the channel.
      </Box>
    </Box>
  );
}

// Please laugh
// Meant to be a large sentinel value to mark the last message (when loaded) position
// as Virtuoso does not allow negative values
const FUNNY_NUMBER = 69_420_000;

function RealMessageView({ channel }: { channel: MikotoChannel }) {
  useFetchMember(channel.space!);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  const crypto = useCrypto();
  const isDm = channel.space?.type === 'DM';
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

    // Decrypt if this is an encrypted DM message
    if (isDm && crypto && x.ciphertext && x.ciphertext.length > 0) {
      const ciphertextBase64 = btoa(
        String.fromCharCode(...x.ciphertext),
      );
      crypto
        .decrypt(channel.spaceId, ciphertextBase64)
        .then((plaintext) => {
          const decrypted = { ...x, content: plaintext };
          setMsgs((xs) => {
            if (xs === null) return null;
            return [...xs, new MikotoMessage(decrypted, mikoto)];
          });
        })
        .catch(() => {
          // Decryption failed — show encrypted indicator
          const failed = { ...x, content: '[Encrypted message — unable to decrypt]' };
          setMsgs((xs) => {
            if (xs === null) return null;
            return [...xs, new MikotoMessage(failed, mikoto)];
          });
        });
    } else {
      setMsgs((xs) => {
        if (xs === null) return null;
        return [...xs, new MikotoMessage(x, mikoto)];
      });
    }

    setCurrentTypers((ts) => ts.filter((y) => y.userId !== x.author?.id));
    mikoto.rest['channels.acknowledge'](undefined, {
      params: {
        spaceId: channel.spaceId,
        channelId: channel.id,
      },
    }).then(() => {});
    setScrollToBottom(true);
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
        ? () => <ChannelHead channel={channel} />
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
      <TabName name={channel.name} icon={channel.space?.icon ?? faHashtag} />
      <Grid templateRows="auto 24px" h="100%">
        <Flex direction="column">
          {msgs === null ? (
            <MessagesLoading />
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              followOutput="auto"
              defaultItemHeight={64}
              style={{ flexGrow: 1, overflowX: 'hidden' }}
              initialTopMostItemIndex={msgs.length - 1}
              data={msgs}
              computeItemKey={(index, msg) => msg.id}
              atBottomStateChange={(atBottom) => {
                setBottomState(atBottom);
              }}
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
                  {showDateSeparator(msg, msgs[index - firstItemIndex - 1]) && (
                    <DateSeparator date={new Date(msg.timestamp)} />
                  )}
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
          <MessageEditor
            placeholder={`Message #${channel.name}`}
            key={currentEditState?.id ?? 'base'}
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

                // Encrypt for DM spaces
                let ciphertext: string | undefined;
                if (isDm && crypto) {
                  const spaceId = channel.spaceId;
                  const hasState = await crypto.hasGroupState(spaceId);
                  if (hasState) {
                    ciphertext = await crypto.encrypt(spaceId, msg);
                  }
                }

                await channel.sendMessage(
                  ciphertext ? '' : msg,
                  attachments,
                  ciphertext,
                );
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
    <CurrentSpaceContext.Provider value={channel.space!}>
      <RealMessageView channel={channel} />
    </CurrentSpaceContext.Provider>
  );
}
