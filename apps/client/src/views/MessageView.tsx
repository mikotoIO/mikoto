import React from 'react';
import styled from 'styled-components';

import { ClientChannel, useMikoto } from '../api';
import { Channel, Message } from '../models';
import MessageItem from '../components/Message';
import { MessageInput } from '../components/MessageInput';
import { ViewContainer } from '../components/ViewContainer';
import { useDeltaX } from '../hooks/useDelta';

const Messages = styled.div`
  overflow-y: auto;
  flex-grow: 1;
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

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();

  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  });

  const mChannel = mikoto.getChannel_CACHED(channel.id);
  const messageDelta = useDeltaX(mChannel.messages, [channel.id]);

  const messages = messageDelta.data;

  return (
    <ViewContainer>
      <Messages ref={ref}>
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isSimple={isMessageSimple(msg, messages[idx - 1])}
          />
        ))}
      </Messages>
      <MessageInput
        channelName={channel.name}
        onMessageSend={async (msg) => {
          await mikoto.sendMessage(channel.id, msg);
        }}
      />
    </ViewContainer>
  );
}
