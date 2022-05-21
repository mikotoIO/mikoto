import React from 'react';
import styled from 'styled-components';
import { useMikoto } from '../api';
import { Channel, Message } from '../models';
import { useSocketIO } from '../hooks/useSocketIO';
import MessageItem from '../components/Message';
import { MessageInput } from '../components/MessageInput';
import { useDelta } from '../hooks';

const MessageViewContainer = styled.div`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Messages = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

interface MessageViewProps {
  channel: Channel;
}

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();

  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  });

  const messageDelta = useDelta<Message>(
    {
      initializer: () => mikoto.getMessages(channel.id),
      predicate: (x) => x.channelId === channel.id,
    },
    [channel.id],
  );
  useSocketIO<Message>(mikoto.io, 'messageCreate', messageDelta.create, [
    channel.id,
  ]);
  useSocketIO<Message>(mikoto.io, 'messageDelete', messageDelta.delete, [
    channel.id,
  ]);

  const messages = messageDelta.data;

  return (
    <MessageViewContainer>
      <Messages ref={ref}>
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const simpleMessage =
            prevMsg &&
            prevMsg.authorId === msg.authorId &&
            new Date(msg.timestamp).getTime() -
              new Date(prevMsg.timestamp).getTime() <
              5 * 60 * 1000;
          return (
            <MessageItem key={msg.id} message={msg} isSimple={simpleMessage} />
          );
        })}
      </Messages>
      <MessageInput
        channelName={channel.name}
        onMessageSend={async (msg) => {
          await mikoto.sendMessage(channel.id, msg);
        }}
      />
    </MessageViewContainer>
  );
}
