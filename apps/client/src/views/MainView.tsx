import { Box, Center } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faBarsStaggered,
  faGlobe,
  faMagnifyingGlass,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { CommandMenuKit, commandMenuOpenAtom } from '@/components/CommandMenu';
import { ContextMenuKit, ModalKit } from '@/components/ContextMenu';
import { DockViewSurface } from '@/components/DockViewSurface';
import { faMikoto } from '@/components/icons';
import { Sidebar } from '@/components/sidebars/Base';
import { FriendSidebar } from '@/components/sidebars/FriendSidebar';
import { MemberListSidebar } from '@/components/sidebars/MemberListSidebar';
import { SpaceSidebar } from '@/components/sidebars/SpaceSidebar';
import { surfaceMap } from '@/components/surfaces';
import { TabBarButton } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, workspaceState } from '@/store';
import { Tabable, useTabkit } from '@/store/surface';

import { MikotoClientProvider } from './MikotoClientProvider';

const AppContainer = styled.div`
  background-color: var(--chakra-colors-subsurface);
  color: var(--chakra-colors-text);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

const TopBar = styled.div`
  background-color: var(--chakra-colors-surface);
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--chakra-colors-gray-700);
  flex-shrink: 0;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
`;

const TopBarCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--chakra-colors-gray-650);
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--chakra-colors-gray-400);
  min-width: 240px;
  cursor: pointer;
  :hover {
    background-color: var(--chakra-colors-gray-600);
  }

  &:focus-within {
    background-color: var(--chakra-colors-gray-600);
  }

  input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--chakra-colors-text);
    width: 100%;

    &::placeholder {
      color: var(--chakra-colors-gray-400);
    }
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  flex-shrink: 0;

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

const DockViewContainer = styled.div`
  height: 100%;
  flex: 1;
  min-width: 0; /* Prevent flex items from overflowing */

  .dv-tab {
    font-size: 14px;
  }
`;

const AppView = () => {
  const leftSidebar = useAtomValue(treebarSpaceState);
  const mikoto = useMikoto();
  const [workspace, setWorkspace] = useAtom(workspaceState);
  const tabkit = useTabkit();
  const setCommandMenuOpen = useSetAtom(commandMenuOpenAtom);

  const spaceId =
    leftSidebar && leftSidebar.kind === 'explorer'
      ? leftSidebar.spaceId
      : undefined;

  const space = spaceId ? mikoto.spaces._get(spaceId) : undefined;

  return (
    <AppContainer>
      <TopBar>
        <TopBarLeft>
          <TabBarButton
            onClick={() => {
              tabkit.openTab({ kind: 'spaceExplorer', key: 'spaceExplorer' });
            }}
          >
            <FontAwesomeIcon icon={faGlobe} />
          </TabBarButton>
          <TabBarButton
            onClick={() => {
              setWorkspace((ws) => ({
                ...ws,
                leftOpen: !ws.leftOpen,
              }));
            }}
          >
            <FontAwesomeIcon icon={faBarsStaggered} />
          </TabBarButton>
          {/* <FontAwesomeIcon icon={faMikoto} /> */}
        </TopBarLeft>
        <TopBarCenter>
          <SearchBar onClick={() => setCommandMenuOpen(true)}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span>Search...</span>
          </SearchBar>
        </TopBarCenter>
        <TopBarRight>
          {space && (
            <TabBarButton
              onClick={() => {
                setWorkspace((ws) => ({
                  ...ws,
                  rightOpen: !ws.rightOpen,
                }));
              }}
            >
              <FontAwesomeIcon icon={faUsers} />
            </TabBarButton>
          )}
        </TopBarRight>
      </TopBar>
      <MainContent>
        <LeftBar>
          <div className="bars">
            <SpaceSidebar />
            {workspace.leftOpen && (
              <Sidebar
                position="left"
                size={workspace.left || 300}
                onResize={(size) => {
                  setWorkspace((ws) => ({
                    ...ws,
                    left: (ws.left || 300) + size.width,
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
        <DockViewContainer>
          <DockViewSurface />
        </DockViewContainer>
        <LeftBar>
          <div className="bars">
            {workspace.rightOpen && (
              <Sidebar
                position="right"
                size={workspace.right || 300}
                onResize={(size) => {
                  setWorkspace((ws) => ({
                    ...ws,
                    right: (ws.right || 300) + size.width,
                  }));
                }}
              >
                {space && <MemberListSidebar space={space} />}
              </Sidebar>
            )}
          </div>
        </LeftBar>
      </MainContent>
    </AppContainer>
  );
};

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
