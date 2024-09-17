import { Box, Flex, Grid, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import throttle from 'lodash/throttle';
import { Channel, ClientChannel, ClientMessage, MessageExt } from 'mikotojs';
import { runInAction } from 'mobx';
import { Observer, observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useFetchMember, useMikoto } from '@/hooks';
import { CurrentSpaceContext } from '@/store';
import { Spinner } from '@/ui/Spinner';

import { DateSeparator, showDateSeparator } from './DateSeparator';
import { MessageEditState, MessageItem } from './Message';
import { MessageEditor } from './MessageEditor';
import { TypingIndicator, useTyping } from './TypingIndicator';

const StyledMessagesLoading = styled.div`
  padding: 40px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function MessagesLoading() {
  return (
    <StyledMessagesLoading>
      <Spinner />
    </StyledMessagesLoading>
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

const RealMessageView = observer(({ channel }: { channel: ClientChannel }) => {
  useFetchMember(channel.space!);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);

  const [currentTypers, setCurrentTypers] = useTyping();
  const [bottomState, setBottomState] = useState(false);
  const [messageEditState] = useState(() => new MessageEditState());

  // TODO: When I wrote this code, only God and I understood what I was doing
  // At this point, I don't think God understands it either
  // useEffect(
  //   () =>
  //     mikoto.client.messages.onTypingStart((ev) => {
  //       if (ev.channelId !== channel.id) return;
  //       if (ev.userId === mikoto.me.id) return;

  //       setCurrentTypers((cts) => {
  //         const ct = [...cts];
  //         let exists = false;
  //         ct.forEach((x) => {
  //           if (x.userId === ev.userId) {
  //             exists = true;
  //             x.timestamp = Date.now() + 5000;
  //           }
  //         });
  //         if (!exists) {
  //           ct.push({
  //             timestamp: Date.now() + 5000,
  //             userId: ev.userId,
  //           });
  //         }
  //         return ct;
  //       });
  //     }),
  //   [channel.id],
  // );

  const typing = useCallback(
    throttle(() => {
      // TODO: reimplement typing
      // mikoto.client.messages
      //   .startTyping({
      //     channelId: channel.id,
      //   })
      //   .then();
    }, 3000),
    [],
  );

  const [msgs, setMsgs] = useState<ClientMessage[] | null>(null);
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
    setMsgs((xs) => {
      if (xs === null) return null;
      setCurrentTypers((ts) => ts.filter((y) => y.userId !== x.author?.id));
      // mikoto.client.messages
      //   .ack({
      //     channelId: channel.id,
      //     timestamp: x.timestamp,
      //   })
      //   .then(() => {});
      mikoto.api['channels.acknowledge'](undefined, {
        params: {
          spaceId: channel.spaceId,
          channelId: channel.id,
        },
      }).then(() => {});
      setScrollToBottom(true);
      return [...xs, new ClientMessage(mikoto, x)];
    });
  };

  const updateFn = (x: MessageExt) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      return xs?.map((m) => (m.id === x.id ? new ClientMessage(mikoto, x) : m));
    });
  };

  const deleteFn = (id: string) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      setScrollToBottom(true);
      return xs.filter((y) => y.id !== id);
    });
  };

  useEffect(() => {
    mikoto.messageEmitter.on(`create/${channel.id}`, createFn);
    mikoto.messageEmitter.on(`update/${channel.id}`, updateFn);
    mikoto.messageEmitter.on(`delete/${channel.id}`, deleteFn);
    return () => {
      mikoto.messageEmitter.off(`create/${channel.id}`, createFn);
      mikoto.messageEmitter.off(`update/${channel.id}`, updateFn);
      mikoto.messageEmitter.off(`delete/${channel.id}`, deleteFn);
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
              increaseViewportBy={{
                top: 200,
                bottom: 200,
              }}
              followOutput="auto"
              defaultItemHeight={28}
              style={{ flexGrow: 1, overflowX: 'hidden' }}
              initialTopMostItemIndex={msgs.length - 1}
              data={msgs}
              atBottomStateChange={(atBottom) => {
                setBottomState(atBottom);
              }}
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
                <Observer>
                  {() => (
                    <>
                      {showDateSeparator(
                        msg,
                        msgs[index - firstItemIndex - 1],
                      ) && <DateSeparator date={new Date(msg.timestamp)} />}
                      <MessageItem
                        editState={messageEditState}
                        message={msg}
                        // message={new ClientMessage(mikoto, msg)}
                        isSimple={isMessageSimple(
                          msg,
                          msgs[index - firstItemIndex - 1],
                        )}
                      />
                    </>
                  )}
                </Observer>
              )}
            />
          )}
          <MessageEditor
            editState={messageEditState}
            placeholder={`Message #${channel.name}`}
            key={messageEditState.message?.id ?? 'base'}
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
            onSubmit={async (msg) => {
              if (messageEditState.message) {
                const m = messageEditState.message;
                runInAction(() => {
                  messageEditState.message = null;
                });
                await m.edit(msg);
              } else {
                await channel.sendMessage(msg);
              }
            }}
          />
        </Flex>
        <TypingIndicator typers={currentTypers} channel={channel} />
      </Grid>
    </Surface>
  );
});

export function MessageSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  return (
    <CurrentSpaceContext.Provider value={channel.space!}>
      <RealMessageView channel={channel} />
    </CurrentSpaceContext.Provider>
  );
}
