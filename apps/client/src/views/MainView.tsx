import MikotoClient, {
  ClientSpace,
  constructMikoto,
  MikotoContext,
  useMikoto,
} from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';

import { ContextMenuKit } from '../components/ContextMenu';
import { Explorer } from '../components/Explorer';
import { ServerSidebar } from '../components/ServerSidebar';
import { TabbedView } from '../components/TabBar';
import { Sidebar } from '../components/UserArea';
import constants from '../constants';
import { Tabable, tabbedState, TabContext, treebarSpaceState } from '../store';
import { AccountSettingsView } from './AccountSettingsView';
import { MessageView } from './MessageView';
import { SpaceSettingsView } from './SpaceSettingsView';
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
            <TabContext.Provider
              value={{ key: `${tab.kind}/${tab.key}` }}
              key={`${tab.kind}/${tab.key}`}
            >
              <div
                style={idx !== tabbed.index ? { display: 'none' } : undefined}
              >
                <TabViewSwitch tab={tab} />
              </div>
            </TabContext.Provider>
          ))}
        </ErrorBoundaryPage>
      </TabbedView>
    </AppContainer>
  );
}

function MikotoApiLoader({ children }: { children: React.ReactNode }) {
  const [mikoto, setMikoto] = React.useState<MikotoClient | null>(null);
  useEffect(() => {
    constructMikoto(constants.apiPath).then((x) => setMikoto(x));
  }, []);

  if (mikoto === null) return null;
  return (
    <MikotoContext.Provider value={mikoto}>{children}</MikotoContext.Provider>
  );
}

export default function MainView() {
  return (
    <MikotoApiLoader>
      <AppView />
      <ContextMenuKit />
    </MikotoApiLoader>
  );
}
