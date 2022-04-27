import React, {useEffect, useState} from "react";
import styled from "styled-components";
import {useMikoto} from "../api";
import {Channel, Message} from "../models";
import MessageItem from "../components/Message";
import {TreeBar} from "../components/TreeBar";
import {Socket} from "socket.io-client";
import {atom, useRecoilState} from "recoil";
import {MessageInput} from "../components/MessageInput";

const AppContainer = styled.div`
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: grid;
  grid-template-rows: 100vh;
  grid-template-columns: 300px calc(100vw - 300px);
  grid-template-areas: "sidebar main";
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
  // height: calc(100% - 80px);
  flex-grow: 1;
`;

interface MessageViewProps {
  channel: Channel;
}

function useSocketIO<T>(io: Socket, ev: string, fn: (data: T) => void, deps?: React.DependencyList | undefined) {
  useEffect(() => {
    io.on(ev, fn);
    return () => {
      io.off(ev, fn);
    }
  }, [ev, fn, deps, io])
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
    mikoto.getMessages(channel.id)
      .then(setMessages);
  }, [mikoto, channel.id]);

  useSocketIO<Message>(mikoto.io, 'messageCreate', (x) => {
    if (x.channelId === channel.id) {
      setMessages((xs) => [...xs, x])
    }
  }, [channel.id]);

  useSocketIO<Message>(mikoto.io, 'messageDelete', (msg) => {
    if (msg.channelId === channel.id) {
      setMessages((xs) => xs.filter(x => msg.id !== x.id))
    }
  }, [channel.id]);

  return (
    <MessageViewContainer>
      <Messages ref={ref}>
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const simpleMessage = prevMsg && prevMsg.authorId === msg.authorId &&
            (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime())< 5 * 60 * 1000;
          return <MessageItem key={msg.id} message={msg} isSimple={simpleMessage}/>
        })}
      </Messages>
      <MessageInput channelName={channel.name} onMessageSend={async (msg) => {
        await mikoto.sendMessage(channel.id, msg);
      }}
      />
    </MessageViewContainer>
  );
}

interface TabbedViewProps {
  children: React.ReactNode
}

const TabbedViewContainer = styled.div`
  grid-area: main;
  display: grid;
  grid-template-rows: 32px calc(100vh - 32px);
`;

const TabBar = styled.div`
  font-size: 14px;
  height: 36px;
  display: flex;
`;

const TabItem = styled.div`
  height: 100%;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background-color: ${p => p.theme.colors.N800};
  border-left: 4px solid #3b83ff;
`;

const currentChannelState = atom<Channel|null>({
  key: 'currentChannel',
  default: null,
});

function TabbedView({children}: TabbedViewProps) {
  const [currentChannel] = useRecoilState(currentChannelState);

  return (
    <TabbedViewContainer>
      <TabBar>
        <TabItem>{currentChannel?.name}</TabItem>
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}

function AppView() {
  const [currentChannel, setCurrentChannel] = useRecoilState(currentChannelState);
  const [channels, setChannels] = useState<Channel[]>([]);
  const mikoto = useMikoto();

  React.useEffect(() => {
    mikoto.getChannels().then(setChannels);
  }, [mikoto]);



  return (
    <AppContainer>
      <Sidebar>
        <TreeBar channels={channels} onClick={(ch) => {
          setCurrentChannel(ch);
        }}/>
      </Sidebar>
      <TabbedView>
        {currentChannel && <MessageView channel={currentChannel}/>}
      </TabbedView>
    </AppContainer>
  );
}

export default function MainView() {
  return (
    <AppView />
  );
}
