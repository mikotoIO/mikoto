import React, { useState } from 'react';
import styled from 'styled-components';
import { useMikoto } from '../api';
import { Channel, Message } from '../models';
import { useSocketIO } from '../hooks/useSocketIO';
import MessageItem from '../components/Message';
import { MessageInput } from '../components/MessageInput';

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

  const [messages, setMessages] = useState<Message[]>([]);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  });

  React.useEffect(() => {
    mikoto.getMessages(channel.id).then(setMessages);
  }, [mikoto, channel.id]);

  useSocketIO<Message>(
    mikoto.io,
    'messageCreate',
    (x) => {
      if (x.channelId === channel.id) {
        setMessages((xs) => [...xs, x]);
      }
    },
    [channel.id],
  );

  useSocketIO<Message>(
    mikoto.io,
    'messageDelete',
    (msg) => {
      if (msg.channelId === channel.id) {
        setMessages((xs) => xs.filter((x) => msg.id !== x.id));
      }
    },
    [channel.id],
  );

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
