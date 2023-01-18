import { ClientChannel, ClientMessage } from 'mikotojs';
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
import { Channel } from '../models';
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

function isMessageSimple(message: ClientMessage, prevMessage: ClientMessage) {
  return (
    prevMessage &&
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

const StyledChannelHead = styled.div`
  padding: 8px 32px;
  h1 {
    font-size: 24px;
  }
`;

function ChannelHead({ channel }: { channel: ClientChannel }) {
  return (
    <StyledChannelHead>
      <h1>Welcome to #{channel.name}!</h1>
    </StyledChannelHead>
  );
}

// Please laugh
const FUNNY_NUMBER = 69_420_000;

function RealMessageView({ channel }: { channel: ClientChannel }) {
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);
  const mikoto = useMikoto();
  // you will probably run out of memory before this number
  const [firstItemIndex, setFirstItemIndex] = useState(FUNNY_NUMBER);
  const [topLoaded, setTopLoaded] = useState(false);

  useEffect(() => {
    mikoto.ack(channel.id).then();
  }, [channel.id]);

  const [msgs, setMsgs] = useState<ClientMessage[] | null>(null);
  useEffect(() => {
    channel.messages.fetch().then(setMsgs);
  }, [channel.id]);

  const [scrollToBottom, setScrollToBottom] = useState(false);
  useEffect(() => {
    if (virtuosoRef.current && scrollToBottom) {
      virtuosoRef.current.autoscrollToBottom();
      virtuosoRef.current.scrollToIndex({ index: msgs!.length - 1 });
      setScrollToBottom(false);
    }
  });

  const createFn = (x: ClientMessage) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      setScrollToBottom(true);
      return [...xs, x];
    });
  };

  const deleteFn = (x: ClientMessage) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      return xs.filter((y) => y.id !== x.id);
    });
  };

  useEffect(() => {
    channel.messages.on('create', createFn);
    channel.messages.on('delete', deleteFn);
    return () => {
      channel.messages.off('create', createFn);
      channel.messages.off('delete', deleteFn);
    };
  }, [channel.id]);

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
            const m = await channel.getMessages(msgs[0].id);
            if (m.length === 0) {
              setTopLoaded(true);
              return;
            }
            setMsgs((xs) => (xs ? [...m, ...xs] : null));
            setFirstItemIndex((x) => x - m.length);
          }}
          itemContent={(index, msg) => {
            return (
              <MessageItem
                message={msg}
                isSimple={isMessageSimple(
                  msg,
                  msgs[index - firstItemIndex - 1],
                )}
              />
            );
          }}
        />
      )}
      <MessageEditor
        placeholder={`Message #${channel.name}`}
        onSubmit={async (msg) => {
          await channel.sendMessage(msg);
        }}
      />
    </ViewContainer>
  );
}

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();
  const { result: mChannel, error } = useAsync(
    (id: string) => mikoto.getChannel(id),
    [channel.id],
  );
  if (error) throw error;
  if (!mChannel) return <div>loading</div>;

  return (
    <CurrentSpaceContext.Provider value={mChannel.space}>
      <RealMessageView channel={mChannel} />
    </CurrentSpaceContext.Provider>
  );
}
