import { faBarsStaggered } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@mikoto-io/lucid';
import { Space } from 'mikotojs';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilState, useRecoilValue } from 'recoil';
import styled from 'styled-components';

import { ContextMenuKit, ModalKit } from '../components/ContextMenu';
import { Explorer } from '../components/Explorer';
import { ServerSidebar } from '../components/ServerSidebar';
import { TabBarButton, TabbedView } from '../components/TabBar';
import { UserAreaAvatar } from '../components/UserArea';
import { Sidebar } from '../components/sidebars/Base';
import { MemberListSidebar } from '../components/sidebars/MemberListSidebar';
import { AccountSettingsSurface } from '../components/surfaces/AccountSettingSurface';
import { MessageView } from '../components/surfaces/MessageSurface';
import { SpaceSettingsView } from '../components/surfaces/SpaceSettingsSurface';
import { VoiceView } from '../components/surfaces/VoiceSurface';
import { useMikoto } from '../hooks';
import {
  Tabable,
  tabbedState,
  TabContext,
  treebarSpaceState,
  workspaceState,
} from '../store';
import { MikotoApiLoader } from './MikotoApiLoader';
import { DesignStory } from './Palette';

const AppWindow = styled.div`
  height: 100vh;
  width: 100vw;
`;

const AppContainer = styled.div`
  overflow: hidden;
  background-color: var(--N900);
  color: white;
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
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
      return <AccountSettingsSurface />;
    case 'palette':
      return <DesignStory />;
    default:
      return null;
  }
}

const LeftBar = styled(Grid)`
  .top {
    display: flex;
    background-color: var(--N1000);
  }
  .bars {
    display: grid;
    grid-template-columns: auto 1fr;
  }
`;

function AppView() {
  const tabbed = useRecoilValue(tabbedState);

  const spaceVal = useRecoilValue(treebarSpaceState);
  const [space, setSpace] = useState<Space | null>(null);
  const mikoto = useMikoto();

  const [workspace, setWorkspace] = useRecoilState(workspaceState);

  // arguably the worst code I've seen.
  // TODO: Move the storage into redux store, and make it a hook.
  // Lower the fetching/update logic into the Explorer component.
  // make it take just the space id as a prop.
  useEffect(() => {
    if (spaceVal) {
      mikoto.client.spaces.get(spaceVal.id).then((x) => setSpace(x));
    }
  }, [spaceVal?.id]);

  return (
    <AppWindow>
      <AppContainer>
        <LeftBar trow="40px auto">
          <div className="top">
            <TabBarButton
              onClick={() => {
                setWorkspace((ws) => ({
                  ...ws,
                  leftOpen: !workspace.leftOpen,
                }));
              }}
            >
              <FontAwesomeIcon icon={faBarsStaggered} />
            </TabBarButton>
            {workspace.leftOpen && <UserAreaAvatar />}
          </div>
          <div className="bars">
            <ServerSidebar />
            {workspace.leftOpen && (
              <Sidebar
                position="left"
                size={workspace.left}
                onResize={(size) => {
                  setWorkspace((ws) => ({
                    ...ws,
                    left: ws.left + size.width,
                  }));
                }}
              >
                {spaceVal && <Explorer spaceId={spaceVal.id} />}
              </Sidebar>
            )}
          </div>
        </LeftBar>
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
        {workspace.rightOpen && (
          <Sidebar
            position="right"
            size={workspace.right}
            onResize={(size) => {
              setWorkspace((ws) => ({
                ...ws,
                right: ws.right + size.width,
              }));
            }}
          >
            {spaceVal && <MemberListSidebar space={spaceVal} />}
          </Sidebar>
        )}
      </AppContainer>
    </AppWindow>
  );
}

export default function MainView() {
  return (
    <MikotoApiLoader>
      <AppView />
      <ContextMenuKit />
      <ModalKit />
    </MikotoApiLoader>
  );
}
