import { Box, Center } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faBarsStaggered } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilState, useRecoilValue } from 'recoil';

import { CommandMenuKit } from '@/components/CommandMenu';
import { ContextMenuKit, ModalKit } from '@/components/ContextMenu';
import { UserAreaAvatar } from '@/components/UserArea';
import { faMikoto } from '@/components/icons';
import { RESIZABLE_DISABLES, Sidebar } from '@/components/sidebars/Base';
import { FriendSidebar } from '@/components/sidebars/FriendSidebar';
import { MemberListSidebar } from '@/components/sidebars/MemberListSidebar';
import { SpaceSidebar } from '@/components/sidebars/SpaceSidebar';
import {
  ErrorSurface,
  LoadingSurface,
  surfaceMap,
} from '@/components/surfaces';
import { TabBarButton, TabbedView } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, workspaceState } from '@/store';
import {
  SurfaceNode,
  TabContext,
  Tabable,
  surfaceStore,
} from '@/store/surface';

import { MikotoClientProvider } from './MikotoClientProvider';
import { WindowBar } from './WindowBar';

const AppContainer = styled.div`
  background-color: var(--chakra-colors-subsurface);
  color: var(--chakra-colors-text);
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  flex: 1;
`;

function TabViewSwitch({ tab }: { tab: Tabable }) {
  const Selected = surfaceMap[tab.kind] as any; // TODO: type this
  if (!Selected) {
    return null;
  }
  const { kind, key, ...rest } = tab;
  return <Selected {...rest} key={key} />;
}

const LeftBar = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  .top {
    display: flex;
    background-color: var(--chakra-colors-subsurface);
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
  & > div:not(:first-of-type) {
    margin-left: 8px;
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
            <Resizable key={idx} enable={{ ...RESIZABLE_DISABLES, left: true }}>
              <SurfaceGroup surfaceNode={child} />
            </Resizable>
          ))}
        </SurfaceGroupContainer>
      );
    }
    return (
      <TabbedView tabs={surfaceNode.tabs} surfaceNode={surfaceNode}>
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
              <Box py="8px" h="100%">
                <ErrorBoundary FallbackComponent={ErrorSurface}>
                  <Suspense fallback={<LoadingSurface />}>
                    <TabViewSwitch tab={tab} />
                  </Suspense>
                </ErrorBoundary>
              </Box>
            </div>
          </TabContext.Provider>
        ))}
      </TabbedView>
    );
  },
);

const SidebarRest = styled.div`
  flex-grow: 1;
  -webkit-app-region: drag;
`;

const AppView = observer(() => {
  const leftSidebar = useRecoilValue(treebarSpaceState);
  const mikoto = useMikoto();
  const [workspace, setWorkspace] = useRecoilState(workspaceState);

  const spaceId =
    leftSidebar && leftSidebar.kind === 'explorer'
      ? leftSidebar.spaceId
      : undefined;

  const space = spaceId ? mikoto.spaces.get(spaceId) : undefined;

  return (
    <AppContainer>
      <LeftBar>
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
          <SidebarRest />
        </div>
        <div className="bars">
          <SpaceSidebar spaces={mikoto.spaces} />
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
              {leftSidebar ? (
                <TabViewSwitch tab={leftSidebar} />
              ) : (
                <FriendSidebar />
              )}
            </Sidebar>
          )}
        </div>
      </LeftBar>
      <SurfaceGroup surfaceNode={surfaceStore.node} />
      {workspace.rightOpen && (
        <LeftBar>
          <div className="top">
            <WindowBar />
          </div>
          <div className="bars">
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
              {space && <MemberListSidebar space={space} />}
            </Sidebar>
          </div>
        </LeftBar>
      )}
    </AppContainer>
  );
});

function Fallback() {
  return (
    <Center w="100%" h="100%" color="white" flexDir="column">
      <FontAwesomeIcon icon={faMikoto} fontSize="10vw" />
      <Box fontSize="20px" mt="10px">
        Loading...
      </Box>
    </Center>
  );
}

export default function MainView() {
  return (
    <MikotoClientProvider fallback={<Fallback />}>
      <AppView />
      <CommandMenuKit />
      <ContextMenuKit />
      <ModalKit />
    </MikotoClientProvider>
  );
}
