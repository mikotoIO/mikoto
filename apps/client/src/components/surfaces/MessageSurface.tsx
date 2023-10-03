import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { throttle } from 'lodash';
import {
  Channel,
  ClientChannel,
  ClientMessage,
  Member,
  Message,
} from 'mikotojs';
import { runInAction } from 'mobx';
import { Observer, observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState, useRef } from 'react';
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

function isMessageSimple(message: Message, prevMessage: Message) {
  return (
    prevMessage &&
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

const StyledChannelHead = styled.div`
  padding: 8px 64px;
  h1 {
    font-size: 24px;
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
    { timestamp: number; memberId: string }[]
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
  const [messageEditState] = useState(() => new MessageEditState());

  useEffect(
    () =>
      mikoto.client.messages.onTypingStart((ev) => {
        if (ev.channelId !== channel.id) return;
        if (ev.memberId === mikoto.me.id) return;

        setCurrentTypers((cts) => {
          const ct = [...cts];
          let exists = false;
          ct.forEach((x) => {
            if (x.memberId === ev.memberId) {
              exists = true;
              x.timestamp = Date.now() + 5000;
            }
          });
          if (!exists) {
            ct.push({
              timestamp: Date.now() + 5000,
              memberId: ev.memberId,
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
      virtuosoRef.current.autoscrollToBottom();
      virtuosoRef.current.scrollToIndex({ index: msgs!.length - 1 });
      setScrollToBottom(false);
    }
  });

  const createFn = (x: Message) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      setCurrentTypers((ts) => ts.filter((y) => y.memberId !== x.author?.id));
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
      <TabName name={channel.name} icon={faHashtag} />
      <MessagingContainerInner>
        <OtherInner>
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
              components={{
                Header() {
                  return topLoaded ? (
                    <ChannelHead channel={channel} />
                  ) : (
                    <MessagesLoading />
                  );
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
                    <MessageItem
                      editState={messageEditState}
                      message={msg}
                      // message={new ClientMessage(mikoto, msg)}
                      isSimple={isMessageSimple(
                        msg,
                        msgs[index - firstItemIndex - 1],
                      )}
                    />
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
                      mikoto.spaces
                        .get(channel.spaceId)!
                        .members?.get(x.memberId)!,
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

export function MessageView({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  return (
    <CurrentSpaceContext.Provider value={channel.space!}>
      <RealMessageView channel={channel} />
    </CurrentSpaceContext.Provider>
  );
}
