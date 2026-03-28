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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import {
  Skeleton,
  SkeletonCircle,
} from '@/components/ui/skeleton';
import { uploadFile } from '@/functions/fileUpload';
import { useFetchMember, useMikoto } from '@/hooks';
import { CurrentSpaceContext } from '@/store';

import { DateSeparator, showDateSeparator } from './DateSeparator';
import { MessageItem, messageEditState } from './Message';
import { MessageEditor } from './MessageEditor';
import { TypingIndicator, useTyping } from './TypingIndicator';

function MessageSkeleton({ isSimple }: { isSimple?: boolean }) {
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
        <Skeleton height="14px" width={`${50 + Math.random() * 40}%`} />
      </Box>
    </Flex>
  );
}

function MessagesLoading() {
  return (
    <Box flexGrow={1} overflow="hidden" py="16px">
      {[false, true, true, false, true, false, true, true].map(
        (isSimple, i) => (
          <MessageSkeleton key={i} isSimple={isSimple} />
        ),
      )}
    </Box>
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
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);

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
      // mikoto.client.messages
      //   .ack({
      //     channelId: channel.id,
      //     timestamp: x.timestamp,
      //   })
      //   .then(() => {});
      mikoto.rest['channels.acknowledge'](undefined, {
        params: {
          spaceId: channel.spaceId,
          channelId: channel.id,
        },
      }).then(() => {});
      setScrollToBottom(true);
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
              defaultItemHeight={28}
              style={{ flexGrow: 1, overflowX: 'hidden' }}
              initialTopMostItemIndex={msgs.length - 1}
              data={msgs}
              atBottomStateChange={(atBottom) => {
                setBottomState(atBottom);
              }}
              overscan={1000}
              components={{
                Header() {
                  if (topLoaded) return <ChannelHead channel={channel} />;
                  return <MessagesLoading />;
                },
              }}
              firstItemIndex={firstItemIndex}
              startReached={async () => {
                if (!msgs) return;
                if (msgs.length === 0) return;
                const m = await channel.listMessages(50, msgs[0].id);
                if (m.length === 0) {
                  setTopLoaded(true);
                  return;
                }
                setMsgs((xs) => (xs ? [...m, ...xs] : null));
                setFirstItemIndex((x) => x - m.length);
              }}
              itemContent={(index, msg) => (
                <>
                  {showDateSeparator(msg, msgs[index - firstItemIndex - 1]) && (
                    <DateSeparator date={new Date(msg.timestamp)} />
                  )}
                  <MessageItem
                    message={msg}
                    // message={new ClientMessage(mikoto, msg)}
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

                await channel.sendMessage(msg, attachments);
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
