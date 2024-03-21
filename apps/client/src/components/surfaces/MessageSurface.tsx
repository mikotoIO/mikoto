import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import throttle from 'lodash/throttle';
import { Channel, ClientChannel, ClientMessage, Message } from 'mikotojs';
import { runInAction } from 'mobx';
import { Observer, observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import styled from 'styled-components';

import { useFetchMember, useInterval, useMikoto } from '../../hooks';
import { CurrentSpaceContext } from '../../store';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';
import { Spinner } from '../atoms/Spinner';
import { TypingDots } from '../atoms/TypingDots';
import { MessageEditState, MessageItem } from '../molecules/Message';
import { MessageEditor } from '../molecules/MessageEditor';

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

function isMessageSimple(message: Message, prevMessage?: Message) {
  return (
    prevMessage &&
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const StyledDateSeparator = styled.div`
  text-align: center;
  margin: 4px 0;
  color: var(--chakra-colors-gray-400);
  font-size: 12px;
  display: flex;
  align-items: center;

  &:before,
  &:after {
    content: '';
    display: block;
    flex-grow: 1;
    height: 0.5px;
    display: block;
    margin: 0 16px;
    background-color: var(--chakra-colors-gray-250);
    opacity: 0.1;
  }
`;

function DateSeparator({ date }: { date: Date }) {
  return (
    <StyledDateSeparator>
      {DAYS_OF_WEEK[date.getDay()]} {date.toLocaleDateString()}
    </StyledDateSeparator>
  );
}

function showDateSeparator(message: Message, prevMessage?: Message) {
  if (!prevMessage) return true;
  const prevDate = new Date(prevMessage.timestamp);
  const currDate = new Date(message.timestamp);
  return (
    prevDate.getFullYear() !== currDate.getFullYear() ||
    prevDate.getMonth() !== currDate.getMonth() ||
    prevDate.getDate() !== currDate.getDate()
  );
}

const StyledChannelHead = styled.div`
  padding: 16px 64px;
  h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  p {
    color: var(--chakra-colors-gray-250);
    margin: 0;
  }
`;

const StyledTypingIndicatorContainer = styled.div`
  font-size: 12px;
  padding: 0 16px;
`;

function ChannelHead({ channel }: { channel: Channel }) {
  return (
    <StyledChannelHead>
      <h1>Welcome to #{channel.name}!</h1>
      <p>This is the start of the channel.</p>
    </StyledChannelHead>
  );
}

const MessagingContainerInner = styled.div`
  display: grid;
  grid-template-rows: auto 24px;
  height: 100%;
`;

// Please laugh
// Meant to be a large sentinel value to mark the last message (when loaded) position
// as Virtuoso does not allow negative values
const FUNNY_NUMBER = 69_420_000;

const OtherInner = styled.div`
  display: flex;
  flex-direction: column;
`;

function useTyping() {
  const [currentTypers, setCurrentTypers] = useState<
    { timestamp: number; userId: string }[]
  >([]);

  useInterval(() => {
    if (currentTypers.length === 0) return;
    setCurrentTypers(currentTypers.filter((x) => x.timestamp > Date.now()));
  }, 500);
  return [currentTypers, setCurrentTypers] as const;
}

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
  useEffect(
    () =>
      mikoto.client.messages.onTypingStart((ev) => {
        if (ev.channelId !== channel.id) return;
        if (ev.userId === mikoto.me.id) return;

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
      }),
    [channel.id],
  );

  const typing = useCallback(
    throttle(() => {
      mikoto.client.messages
        .startTyping({
          channelId: channel.id,
        })
        .then();
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

  const createFn = (x: Message) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      setCurrentTypers((ts) => ts.filter((y) => y.userId !== x.author?.id));
      mikoto.client.messages
        .ack({
          channelId: channel.id,
          timestamp: x.timestamp,
        })
        .then(() => {});
      setScrollToBottom(true);
      return [...xs, new ClientMessage(mikoto, x)];
    });
  };

  const updateFn = (x: Message) => {
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
    <ViewContainer key={channel.id}>
      <TabName name={channel.name} icon={channel.space?.icon ?? faHashtag} />
      <MessagingContainerInner>
        <OtherInner>
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
                  return topLoaded ? (
                    <ChannelHead channel={channel} />
                  ) : (
                    <MessagesLoading />
                  );
                },
                // Footer() {
                //   return <GhostMessage />;
                // },
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
        </OtherInner>
        <StyledTypingIndicatorContainer>
          {currentTypers.length > 0 && (
            <div>
              <TypingDots />
              <strong>
                {currentTypers
                  .map(
                    (x) =>
                      mikoto.spaces.get(channel.spaceId)?.members?.get(x.userId)
                        ?.user.name ?? 'Unknown',
                  )
                  .join(', ')}
              </strong>{' '}
              is typing...
            </div>
          )}
        </StyledTypingIndicatorContainer>
      </MessagingContainerInner>
    </ViewContainer>
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
