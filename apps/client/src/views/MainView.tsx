import React, { useState } from 'react';
import styled from 'styled-components';
import { useMikoto } from '../api';
import { Channel, Message } from '../models';
import MessageItem from '../components/Message';
import { TreeBar } from '../components/TreeBar';
import { MessageInput } from '../components/MessageInput';
import { useSocketIO } from '../hooks/useSocketIO';
import { TabbedView } from '../components/TabBar';

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

function AppView() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [tabbedChannels, setTabbedChannels] = useState<Channel[]>([]);

  function openNewChannel(ch: Channel) {
    if (!tabbedChannels.some((x) => x.id === ch.id)) {
      setTabbedChannels((xs) => [...xs, ch]);
    }
    setTabIndex(tabbedChannels.length);
  }

  return (
    <AppContainer>
      <Sidebar>
        <TreeBar
          onClick={(ch, ev) => {
            if (tabbedChannels.length === 0) {
              openNewChannel(ch);
              return;
            }

            const idx = tabbedChannels.findIndex((x) => x.id === ch.id);
            if (idx !== -1) {
              setTabIndex(idx);
            } else if (ev.ctrlKey) {
              openNewChannel(ch);
            } else {
              setTabbedChannels((xs) => {
                xs[tabIndex] = ch;
                return [...xs];
              });
            }
          }}
        />
      </Sidebar>
      <TabbedView
        channels={tabbedChannels}
        index={tabIndex}
        onClick={(channel, idx) => {
          setTabIndex(idx);
        }}
        onClose={(ch, idx) => {
          setTabbedChannels((xs) => {
            xs.splice(idx, 1);
            return [...xs]; // React optimizes by comparing reference
          });
          if (idx <= tabIndex) {
            setTabIndex(Math.max(0, idx - 1));
          }
        }}
        onReorder={(channel, dragIndex, dropIndex) => {
          if (dragIndex === dropIndex) return;

          const filteredTabs = tabbedChannels.filter(
            (x) => channel.id !== x.id,
          );

          if (dropIndex === -1) {
            setTabbedChannels([...filteredTabs, channel]);
            setTabIndex(tabbedChannels.length - 1);
          } else {
            const na = [...filteredTabs];
            na.splice(dropIndex, 0, channel);
            setTabbedChannels(na);
            setTabIndex(dropIndex);
          }
        }}
      >
        {tabIndex !== null && tabIndex < tabbedChannels.length && (
          <MessageView channel={tabbedChannels[tabIndex]} />
        )}
      </TabbedView>
    </AppContainer>
  );
}

export default function MainView() {
  return <AppView />;
}
