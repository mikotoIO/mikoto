import React from 'react';
import styled from 'styled-components';
import { useAsync } from 'react-async-hook';

import { ClientChannel, useMikoto } from '../api';
import { Channel, Message } from '../models';
import MessageItem from '../components/Message';
import { ViewContainer } from '../components/ViewContainer';
import { useDelta } from '../hooks/useDelta';
import { Spinner } from '../components/Spinner';
import { MessageEditor } from '../components/MessageEditor';

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

function isMessageSimple(message: Message, prevMessage: Message) {
  return (
    prevMessage &&
    prevMessage.authorId === message.authorId &&
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
  const messageDelta = useDelta(channel.messages, [channel.id]);

  const messages = messageDelta.data;
  return (
    <ViewContainer key={channel.id}>
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
          await mikoto.sendMessage(channel.id, msg);
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
