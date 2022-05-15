import React, { useState } from 'react';
import styled from 'styled-components';
import { Channel } from '../models';
import { TreeBar } from '../components/TreeBar';
import { TabbedView } from '../components/TabBar';
import { AuthRefresher } from '../components/AuthHandler';
import { UserArea } from '../components/UserArea';
import { ServerSidebar } from '../components/ServerSidebar';
import { MessageView } from './MessageView';

const AppContainer = styled.div`
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: flex;
  flex-direction: row;
  height: 100vh;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 270px;
  height: 100%;
`;

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
      <ServerSidebar />
      <Sidebar>
        <UserArea />
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
  return (
    <AuthRefresher>
      <AppView />
    </AuthRefresher>
  );
}
