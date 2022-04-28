import React, { useState } from 'react';
import styled from 'styled-components';
import { useMikoto } from '../api';
import { Channel, Message } from '../models';
import MessageItem from '../components/Message';
import { TreeBar } from '../components/TreeBar';
import { atom, useRecoilState } from 'recoil';
import { MessageInput } from '../components/MessageInput';
import { useSocketIO } from '../hooks/UseSocketIO';
import {
  TabBar,
  TabbedViewContainer,
  TabbedViewProps,
  TabItem,
} from '../components/TabBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareXmark } from '@fortawesome/free-solid-svg-icons';

const AppContainer = styled.div`
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: grid;
  grid-template-rows: 100vh;
  grid-template-columns: 300px calc(100vw - 300px);
  grid-template-areas: 'sidebar main';
`;

const Sidebar = styled.div`
  width: 300px;
  height: 100%;
  position: absolute;
`;

const MessageViewContainer = styled.div`
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

function MessageView({ channel }: MessageViewProps) {
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

const currentChannelState = atom<Channel | null>({
  key: 'currentChannel',
  default: null,
});

function TabbedView({ children, channels }: TabbedViewProps) {
  return (
    <TabbedViewContainer>
      <TabBar>
        {channels.map((channel) => (
          <TabItem key={channel.id} active>
            {channel.name}
          </TabItem>
        ))}
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}

function AppView() {
  const [currentChannel, setCurrentChannel] =
    useRecoilState(currentChannelState);

  return (
    <AppContainer>
      <Sidebar>
        <TreeBar
          onClick={(ch) => {
            setCurrentChannel(ch);
          }}
        />
      </Sidebar>
      <TabbedView
        channels={currentChannel ? [currentChannel] : []}
        activeChannelId={currentChannel?.id}
      >
        {currentChannel && <MessageView channel={currentChannel} />}
      </TabbedView>
    </AppContainer>
  );
}

export default function MainView() {
  return <AppView />;
}
