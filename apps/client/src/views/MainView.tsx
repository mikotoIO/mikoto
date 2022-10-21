import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import { ErrorBoundary } from 'react-error-boundary';
import { Explorer } from '../components/Explorer';
import { TabbedView } from '../components/TabBar';
import { AuthRefresher } from '../components/AuthHandler';
import { Sidebar } from '../components/UserArea';
import { ServerSidebar } from '../components/ServerSidebar';
import { MessageView } from './MessageView';
import { Tabable, tabbedState, treebarSpaceState } from '../store';
import { SpaceSettingsView } from './SpaceSettingsView';
import { useMikoto } from '../api';
import { AccountSettingsView } from './AccountSettingsView';
import { ClientSpace } from '../api/entities/ClientSpace';
import { VoiceView } from './VoiceView';

const AppContainer = styled.div`
  overflow: hidden;
  background-color: ${(p) => p.theme.colors.N900};
  color: white;
  display: flex;
  flex-direction: row;
  height: 100vh;
`;

function ErrorBoundaryPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<div>lol error</div>}>{children}</ErrorBoundary>
  );
}

function TabViewSwitch({ tab }: { tab: Tabable }) {
  switch (tab.kind) {
    case 'textChannel':
      return <MessageView channel={tab.channel} />;
    case 'voiceChannel':
      return <VoiceView channel={tab.channel} />;
    case 'spaceSettings':
      return <SpaceSettingsView space={tab.space} />;
    case 'accountSettings':
      return <AccountSettingsView />;
    default:
      return null;
  }
}

function AppView() {
  const tabbed = useRecoilValue(tabbedState);

  const spaceVal = useRecoilValue(treebarSpaceState);
  const [space, setSpace] = useState<ClientSpace | null>(null);
  const mikoto = useMikoto();
  useEffect(() => {
    if (spaceVal) {
      mikoto.getSpace(spaceVal.id).then((x) => setSpace(x));
    }
  }, [spaceVal?.id]);

  return (
    <AppContainer>
      <ServerSidebar />
      <Sidebar>{space && <Explorer space={space} />}</Sidebar>
      <TabbedView tabs={tabbed.tabs}>
        <ErrorBoundaryPage>
          {tabbed.tabs.map((tab, idx) => (
            <div
              style={idx !== tabbed.index ? { display: 'none' } : undefined}
              key={`${tab.kind}/${tab.key}`}
            >
              <TabViewSwitch tab={tab} />
            </div>
          ))}
        </ErrorBoundaryPage>
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
