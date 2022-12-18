import { ClientChannel, ClientMessage } from 'mikotojs';
import React from 'react';
import { useAsync } from 'react-async-hook';
import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import { ViewContainer } from '../components/ViewContainer';
import { Spinner } from '../components/atoms/Spinner';
import MessageItem from '../components/molecules/Message';
import { MessageEditor } from '../components/molecules/MessageEditor';
import { useMikoto } from '../hooks';
import { useDelta } from '../hooks/useDelta';
import { Channel } from '../models';

const Messages = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const MessagesLoading = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

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

function RealMessageView({ channel }: { channel: ClientChannel }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  });
  const mikoto = useMikoto();

  React.useEffect(() => {
    mikoto.ack(channel.id).then();
  }, [channel.id]);
  const messageDelta = useDelta(channel.messages, [channel.id]);

  const messages = messageDelta.data;
  return (
    <ViewContainer key={channel.id}>
      <TabName name={channel.name} />
      {messageDelta.loading ? (
        <MessagesLoading>
          <Spinner />
        </MessagesLoading>
      ) : (
        <Messages ref={ref}>
          {messages.map((msg, idx) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isSimple={isMessageSimple(msg, messages[idx - 1])}
            />
          ))}
        </Messages>
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

  return <RealMessageView channel={mChannel} />;
}
