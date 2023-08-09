import { throttle } from 'lodash';
import {
  Channel,
  ClientChannel,
  ClientMessage,
  Member,
  Message,
} from 'mikotojs';
import { Observer, observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';

import { useInterval, useMikoto } from '../../hooks';
import { CurrentSpaceContext } from '../../store';
import { TabName } from '../TabBar';
import { userState } from '../UserArea';
import { ViewContainer } from '../ViewContainer';
import { Spinner } from '../atoms/Spinner';
import { TypingDots } from '../atoms/TypingDots';
import { MessageItem } from '../molecules/Message';
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

interface MessageViewProps {
  channel: Channel;
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
const FUNNY_NUMBER = 69_420_000;

const OtherInner = styled.div`
  display: flex;
  flex-direction: column;
`;

const RealMessageView = observer(({ channel }: { channel: ClientChannel }) => {
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  const user = useRecoilValue(userState);
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);

  useEffect(() => {
    // mikoto.ack(channel.id).then();
  }, [channel.id]);

  const [currentTypers, setCurrentTypers] = useState<
    { timestamp: number; member: Member }[]
  >([]);

  useInterval(() => {
    if (currentTypers.length === 0) return;
    setCurrentTypers(currentTypers.filter((x) => x.timestamp > Date.now()));
  }, 500);

  useEffect(
    () =>
      mikoto.client.channels.onTypingStart((ev) => {
        if (ev.channelId !== channel.id) return;
        if (ev.member!.user.id === user?.id) return;

        setCurrentTypers((cts) => {
          const ct = [...cts];
          let exists = false;
          ct.forEach((x) => {
            if (x.member.id === ev.member!.id) {
              exists = true;
              x.timestamp = Date.now() + 5000;
            }
          });
          if (!exists) {
            ct.push({
              timestamp: Date.now() + 5000,
              member: ev.member!,
            });
          }
          return ct;
        });
      }),
    [channel.id],
  );

  const typing = useCallback(
    throttle(() => {
      mikoto.client.channels.startTyping(channel.id, 5000).then();
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
      setCurrentTypers((ts) =>
        ts.filter((y) => y.member.user.id !== x.author?.id),
      );
      mikoto.client.messages.ack(channel.id, x.timestamp).then(() => {});
      setScrollToBottom(true);
      return [...xs, new ClientMessage(mikoto, x)];
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
    mikoto.messageEmitter.on(`delete/${channel.id}`, deleteFn);
    return () => {
      mikoto.messageEmitter.off(`create/${channel.id}`, createFn);
      mikoto.messageEmitter.off(`delete/${channel.id}`, deleteFn);
    };
  }, [channel.id]);

  return (
    <ViewContainer key={channel.id}>
      <TabName name={channel.name} />
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
            placeholder={`Message #${channel.name}`}
            onTyping={() => {
              typing();
            }}
            onSubmit={async (msg) => {
              await mikoto.client.messages.send(channel.id, msg);
            }}
          />
        </OtherInner>
        <StyledTypingIndicatorContainer>
          {currentTypers.length > 0 && (
            <div>
              <TypingDots />
              <strong>
                {currentTypers.map((x) => x.member.user.name).join(', ')}
              </strong>{' '}
              is typing...
            </div>
          )}
        </StyledTypingIndicatorContainer>
      </MessagingContainerInner>
    </ViewContainer>
  );
});

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();
  const space = mikoto.spaces.get(channel.spaceId);
  const cChannel = mikoto.channels.get(channel.id)!;

  return (
    <CurrentSpaceContext.Provider value={space}>
      <RealMessageView channel={cChannel} />
    </CurrentSpaceContext.Provider>
  );
}
