import { faBarsStaggered } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Flex } from '@mikoto-io/lucid';
import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilState, useRecoilValue } from 'recoil';
import styled from 'styled-components';

import { CommandMenuKit } from '../components/CommandMenu';
import { ContextMenuKit, ModalKit } from '../components/ContextMenu';
import { Explorer } from '../components/Explorer';
import { ServerSidebar } from '../components/ServerSidebar';
import { TabBarButton, TabbedView } from '../components/TabBar';
import { UserAreaAvatar } from '../components/UserArea';
import { Sidebar } from '../components/sidebars/Base';
import { FriendSidebar } from '../components/sidebars/FriendSidebar';
import { MemberListSidebar } from '../components/sidebars/MemberListSidebar';
import { AccountSettingsSurface } from '../components/surfaces/AccountSettingsSurface';
import { ChannelSettingsSurface } from '../components/surfaces/ChannelSettingsSurface';
import { DiscoverySurface } from '../components/surfaces/DiscoverySurface';
import { DocumentSurface } from '../components/surfaces/DocumentSurface';
import { FriendsSurface } from '../components/surfaces/FriendsSurface';
import { MessageView } from '../components/surfaces/MessageSurface';
import { SpaceSettingsView } from '../components/surfaces/SpaceSettingsSurface';
import { VoiceView } from '../components/surfaces/VoiceSurface';
import { WelcomeSurface } from '../components/surfaces/WelcomeSurface';
import { useMikoto } from '../hooks';
import { treebarSpaceState, workspaceState } from '../store';
import {
  SurfaceNode,
  surfaceStore,
  Tabable,
  TabContext,
} from '../store/surface';
import { MikotoApiLoader } from './MikotoApiLoader';
import { DesignStory } from './Palette';
import { SearchSurface } from '../components/surfaces/SearchSurface';

const AppContainer = styled.div`
  background-color: var(--N900);
  color: white;
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
`;

function ErrorBoundaryPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<div>lol error</div>}>{children}</ErrorBoundary>
  );
}

function TabViewSwitch({ tab }: { tab: Tabable }) {
  switch (tab.kind) {
    case 'textChannel':
      return <MessageView channelId={tab.channelId} />;
    case 'voiceChannel':
      return <VoiceView channelId={tab.channelId} />;
    case 'documentChannel':
      return <DocumentSurface channelId={tab.channelId} />;
    case 'search':
      return <SearchSurface spaceId={tab.spaceId}/>
    case 'spaceSettings':
      return <SpaceSettingsView spaceId={tab.spaceId} />;
    case 'accountSettings':
      return <AccountSettingsSurface />;
    case 'channelSettings':
      return <ChannelSettingsSurface channelId={tab.channelId} />;
    case 'friends':
      return <FriendsSurface />;
    case 'discovery':
      return <DiscoverySurface />;
    case 'palette':
      return <DesignStory />;
    case 'welcome':
      return <WelcomeSurface />;
    default:
      return null;
  }
}

const LeftBar = styled(Flex)`
  height: 100%;

  .top {
    display: flex;
    background-color: var(--N1000);
  }
  .bars {
    display: flex;
    min-height: 0;
    flex-grow: 1;
  }
`;

const SurfaceGroupContainer = styled.div`
  display: flex;
  height: 100%;
  flex: 1;
  & > div:not(:first-child) {
    border-left: 1px solid var(--N700);
  }
`;

const SurfaceGroup = observer(
  ({ surfaceNode }: { surfaceNode: SurfaceNode }) => {
    if ('children' in surfaceNode) {
      const [head, ...tails] = surfaceNode.children;
      return (
        <SurfaceGroupContainer>
          <SurfaceGroup surfaceNode={head} />
          {tails.map((child, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Resizable key={idx} enable={{ left: true }}>
              <SurfaceGroup surfaceNode={child} />
            </Resizable>
          ))}
        </SurfaceGroupContainer>
      );
    }
    return (
      <TabbedView tabs={surfaceNode.tabs} surfaceNode={surfaceNode}>
        <ErrorBoundaryPage>
          {surfaceNode.tabs.map((tab, idx) => (
            <TabContext.Provider
              value={{ key: `${tab.kind}/${tab.key}` }}
              key={`${tab.kind}/${tab.key}`}
            >
              <div
                style={
                  idx !== surfaceNode.index ? { display: 'none' } : undefined
                }
              >
                <TabViewSwitch tab={tab} />
              </div>
            </TabContext.Provider>
          ))}
        </ErrorBoundaryPage>
      </TabbedView>
    );
  },
);

const AppView = observer(() => {
  const spaceId = useRecoilValue(treebarSpaceState);
  const mikoto = useMikoto();
  const [workspace, setWorkspace] = useRecoilState(workspaceState);

  return (
    <AppContainer>
      <LeftBar dir="column">
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
          <ServerSidebar spaces={mikoto.spaces} />
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
              {spaceId ? (
                <Explorer space={mikoto.spaces.get(spaceId)!} />
              ) : (
                <FriendSidebar />
              )}
            </Sidebar>
          )}
        </div>
      </LeftBar>
      <SurfaceGroup surfaceNode={surfaceStore.node} />
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
          {spaceId && <MemberListSidebar space={mikoto.spaces.get(spaceId)!} />}
        </Sidebar>
      )}
    </AppContainer>
  );
});

export default function MainView() {
  return (
    <MikotoApiLoader>
      <AppView />
      <CommandMenuKit />
      <ContextMenuKit />
      <ModalKit />
    </MikotoApiLoader>
  );
}
