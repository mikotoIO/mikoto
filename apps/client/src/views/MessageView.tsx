import { Channel, Message } from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import { ViewContainer } from '../components/ViewContainer';
import { Spinner } from '../components/atoms/Spinner';
import { MessageItem } from '../components/molecules/Message';
import { MessageEditor } from '../components/molecules/MessageEditor';
import { useMikoto } from '../hooks';
import { useMikotoSelector } from '../redux';
import { CurrentSpaceContext } from '../store';

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
  padding: 4px 16px 8px;
`;

function ChannelHead({ channel }: { channel: Channel }) {
  return (
    <StyledChannelHead>
      <h1>Welcome to #{channel.name}!</h1>
      <p>This is the start of the channel.</p>
    </StyledChannelHead>
  );
}

// Please laugh
const FUNNY_NUMBER = 69_420_000;

function RealMessageView({ channel }: { channel: Channel }) {
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);

  useEffect(() => {
    // mikoto.ack(channel.id).then();
  }, [channel.id]);

  const [msgs, setMsgs] = useState<Message[] | null>(null);
  useEffect(() => {
    mikoto.client.messages
      .list(channel.id, {
        limit: 50,
        cursor: null,
      })
      .then((m) => {
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
      setScrollToBottom(true);
      return [...xs, x];
    });
  };

  const deleteFn = (id: string) => {
    setMsgs((xs) => {
      if (xs === null) return null;
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

  const isTyping = false;

  return (
    <ViewContainer key={channel.id}>
      <TabName name={channel.name} />
      {msgs === null ? (
        <MessagesLoading />
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          followOutput="auto"
          defaultItemHeight={28}
          style={{ flexGrow: 1 }}
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
            const m = await mikoto.client.messages.list(channel.id, {
              limit: 50,
              cursor: msgs[0].id,
            });
            if (m.length === 0) {
              setTopLoaded(true);
              return;
            }
            setMsgs((xs) => (xs ? [...m, ...xs] : null));
            setFirstItemIndex((x) => x - m.length);
          }}
          itemContent={(index, msg) => (
            <MessageItem
              message={msg}
              isSimple={isMessageSimple(msg, msgs[index - firstItemIndex - 1])}
            />
          )}
        />
      )}
      <MessageEditor
        placeholder={`Message #${channel.name}`}
        onSubmit={async (msg) => {
          await mikoto.client.messages.send(channel.id, msg);
        }}
      />
      <StyledTypingIndicatorContainer>
        {isTyping && (
          <div>
            <strong>CactusBlue</strong> is typing...
          </div>
        )}
      </StyledTypingIndicatorContainer>
    </ViewContainer>
  );
}

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();
  const space = useMikotoSelector((s) => s.spaces[channel.spaceId]);

  const { result: mChannel, error } = useAsync(
    (id: string) => mikoto.client.channels.get(id),
    [channel.id],
  );
  if (error) throw error;
  if (!mChannel) return <div>loading</div>;

  return (
    <CurrentSpaceContext.Provider value={space}>
      <RealMessageView channel={mChannel} />
    </CurrentSpaceContext.Provider>
  );
}
