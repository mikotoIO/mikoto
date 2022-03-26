import React, {useState} from "react";
import styled from "styled-components";
import MikotoApi, {Channel, Message} from "../api";
import ChatEditor from "../components/ChatEditor";
import MessageItem from "../components/Message";
import {TreeContainer, TreeNode} from "../components/TreeBar";

const AppContainer = styled.div`
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
`;

const Messages = styled.div`
  overflow-y: auto;
  height: calc(100% - 80px);
`;

const api = new MikotoApi();

interface MessageViewProps {
  channel: Channel;
}

function MessageView({ channel }: MessageViewProps) {
  // const channelId = '076a960d-5c78-41a3-9c7a-9e82036979f7'

  const [messages, setMessages] = useState<Message[]>([]);
  const ref = React.useRef<any>();
  React.useEffect(() => {
    ref.current.scrollTop = ref.current.scrollHeight;
  });

  React.useEffect(() => {
    api.axios.get<Message[]>(`/channels/${channel.id}/messages`)
      .then(({data}) => {
        setMessages(data);
      });
  }, [channel.id]);

  return (
    <MessageViewContainer>
      <Messages ref={ref}>
        {messages.map((msg) => <MessageItem key={msg.id} message={msg}/>)}
      </Messages>
      <ChatEditor channelName={channel.name} onMessageSend={async (msg) => {
        const m = await api.axios.post<Message>(`/channels/${channel.id}`, {
          content: msg,
        });

        setMessages((xs) => [...xs, m.data])
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
  height: 40px;
  display: flex;
`;

const TabItem = styled.div`
  height: 100%;
  padding: 4px 32px 0;
  
  background-color: ${p => p.theme.colors.N800};
  border-left: 4px solid #3b83ff;
`;

function TabbedView({children}: TabbedViewProps) {
  return (
    <TabbedViewContainer>
      <TabBar>
        <TabItem>general</TabItem>
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}

export default function MainView() {
  const [currentChannel, setCurrentChannel] = useState<Channel|null>(null)
  const [channels, setChannels] = useState<Channel[]>([])

  React.useEffect(() => {
    api.axios.get<Channel[]>(`/spaces/bcc723e1-c8c9-4489-bc58-7172d70190eb/channels`)
      .then(({data}) => {
        setChannels(data);
      });
  }, []);


  return (
    <AppContainer>
      <Sidebar>
        <TreeContainer>
          {channels.map(x =>
            <TreeNode channel={x} key={x.id} onClick={() => {
              setCurrentChannel(x)
            }}/>
          )}
        </TreeContainer>
      </Sidebar>
      <TabbedView>
        {currentChannel && <MessageView channel={currentChannel}/>}
      </TabbedView>
    </AppContainer>
  );
}
