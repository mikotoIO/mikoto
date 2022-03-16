import React, {useState} from "react";
import styled from "styled-components";
import MikotoApi, {Message} from "../api";
import ChatEditor from "../components/ChatEditor";
import MessageItem from "../components/Message";

const AppContainer = styled.div`
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: grid;
  grid-template-rows: 100vh;
  grid-template-columns: 300px calc(100vw - 300px);
  grid-template-areas: "sidebar main";
`;

const Sidebar = styled.div`
  position: absolute;
`;

const MessageViewContainer = styled.div`
  grid-area: main;
  display: grid;
  grid-template-rows: 1fr auto;
  background-color: ${(p) => p.theme.colors.N800};
`;

const Messages = styled.div`
  overflow-y: auto;
`;

const api = new MikotoApi();

function MessageView() {
  const channelId = '64c30c25-57d0-44a7-be8f-7591d8c9bed4'

  const [messages, setMessages] = useState<Message[]>([]);
  const ref = React.useRef<any>();
  React.useEffect(() => {
    ref.current.scrollTop = ref.current.scrollHeight;
  });

  React.useEffect(() => {
    api.axios.get<Message[]>(`/channels/${channelId}/messages`)
      .then(({data}) => {
        setMessages(data);
      });
  }, []);

  return (
    <MessageViewContainer>
      <Messages ref={ref}>
        {messages.map((msg) => <MessageItem key={msg.id} message={msg}/>)}
      </Messages>
      <ChatEditor onMessageSend={async (msg) => {
        const m = await api.axios.post<Message>(`/channels/${channelId}`, {
          content: msg,
        });

        setMessages((xs) => [...xs, m.data])
      }}
      />
    </MessageViewContainer>
  );
}

export default function MainView() {
  return (
    <AppContainer>
      <Sidebar>lol</Sidebar>
      <MessageView/>
    </AppContainer>
  );
}
