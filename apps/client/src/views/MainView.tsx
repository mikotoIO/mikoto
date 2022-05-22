import React from 'react';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import { TreeBar } from '../components/TreeBar';
import { TabbedView } from '../components/TabBar';
import { AuthRefresher } from '../components/AuthHandler';
import { UserArea } from '../components/UserArea';
import { ServerSidebar } from '../components/ServerSidebar';
import { MessageView } from './MessageView';
import { Tabable, tabbedState } from '../store';

const AppContainer = styled.div`
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: flex;
  flex-direction: row;
  height: 100vh;
`;

const SidebarElement = styled.div`
  display: flex;
  flex-direction: column;
  width: 270px;
  height: 100%;
`;

function TabViewSwitch({ tab }: { tab: Tabable }) {
  switch (tab.kind) {
    case 'textChannel':
      return <MessageView channel={tab.channel} />;
    default:
      return null;
  }
}

function AppView() {
  const tabbed = useRecoilValue(tabbedState);

  return (
    <AppContainer>
      <ServerSidebar />
      <SidebarElement>
        <UserArea />
        <TreeBar />
      </SidebarElement>
      <TabbedView tabs={tabbed.tabs}>
        {tabbed.index !== null && tabbed.index < tabbed.tabs.length && (
          <TabViewSwitch tab={tabbed.tabs[tabbed.index]} />
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
