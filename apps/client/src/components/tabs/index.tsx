import { Box, Button, Flex, Grid } from '@chakra-ui/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faBarsStaggered,
  faQuestion,
  faX,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Helmet } from 'react-helmet-async';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { channelToTab } from '@/components/surfaces/Explorer/channelToTab';
import type { ExplorerNode } from '@/components/surfaces/Explorer/explorerNode';
import { useMikoto } from '@/hooks';
import { workspaceState } from '@/store';
import {
  SurfaceLeaf,
  TabContext,
  TabNameProps,
  Tabable,
  pruneNode,
  splitNode,
  surfaceStore,
  tabNameFamily,
} from '@/store/surface';

import { IconBox } from './IconBox';
import { WelcomeToMikoto } from './Welcome';

const StyledCloseButton = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: ${(p) => (p.active ? 'white' : 'transparent')};

  &:hover {
    background-color: rgba(0, 0, 0, 0.25);
    color: white;
  }
`;

const StyledTab = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  user-select: none;
  cursor: pointer;
  padding: 0 8px 0 16px;
  gap: 6px;
  flex-shrink: 0;
  border-bottom: 2px solid transparent;
  color: var(--chakra-colors-gray-300);

  ${(p) =>
    p.active &&
    css`
      color: var(--chakra-colors-gray-200);
      border-color: var(--chakra-colors-primary);
      background-color: var(--chakra-colors-surface);
    `}

  &:hover {
    background-color: var(--chakra-colors-surface);
  }
`;

interface TabProps {
  tab: Tabable;
  index: number;
  surfaceNode: SurfaceLeaf;
}

interface TabDnd {
  tab: Tabable;
  surfaceLeaf: SurfaceLeaf;
  dragIndex: number;
}

// TODO: This is a very leaky abstraction. It handles sorting tabs,
// as well as dispatching actions to the store.
function useReorderable(destinationSurface: SurfaceLeaf) {
  return (dragIndex: number, dropIndex: number, originSurface: SurfaceLeaf) => {
    runInAction(() => {
      const nt = originSurface.tabs.splice(dragIndex, 1)[0];

      originSurface.index = 0;

      if (dropIndex === -1) {
        destinationSurface.index = destinationSurface.tabs.length;
        destinationSurface.tabs.push(nt);
      } else {
        destinationSurface.tabs.splice(dropIndex, 0, nt);
        destinationSurface.index = dropIndex;
      }

      pruneNode(surfaceStore.node);
    });
  };
}

export function TabName({ name, icon }: TabNameProps) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useRecoilState(tabNameFamily(tabInfo.key));
  useEffect(() => {
    if (tabName.name !== name) {
      setTabName({
        ...tabName,
        name,
        icon,
      });
    }
  }, [name]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}

function Tab({ tab, index, surfaceNode }: TabProps) {
  // used for when this component is the `drop` of a DnD
  const reorderFn = useReorderable(surfaceNode);
  const tabName = useRecoilValue(tabNameFamily(`${tab.kind}/${tab.key}`));

  const ref = useRef<HTMLDivElement>(null);
  const [, drag] = useDrag<TabDnd>({
    type: 'TAB',
    item: { tab, dragIndex: index, surfaceLeaf: surfaceNode },
  });
  const [, drop] = useDrop<TabDnd>({
    accept: 'TAB',
    drop(item) {
      reorderFn(item.dragIndex, index, item.surfaceLeaf);
    },
  });
  drag(drop(ref));

  const active = index === surfaceNode.index;

  const closeTab = action(() => {
    surfaceNode.tabs.splice(index, 1);

    if (index <= surfaceNode.index) {
      surfaceNode.index = Math.max(0, index - 1);
    }
    pruneNode(surfaceStore.node);
  });

  const contextMenu = useContextMenu(() => (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          closeTab();
        }}
      >
        Close
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={action(() => {
          surfaceNode.tabs = [];
          surfaceNode.index = -1;
          pruneNode(surfaceStore.node);
        })}
      >
        Close All
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          splitNode();
        }}
      >
        Split Tab
      </ContextMenu.Link>
    </ContextMenu>
  ));

  return (
    <StyledTab
      ref={ref}
      key={tab.key}
      active={active}
      onContextMenu={contextMenu}
      onClick={action(() => {
        surfaceNode.index = index;
      })}
      onAuxClick={() => {}}
    >
      {typeof tabName.icon !== 'string' ? (
        <IconBox size={20} icon={tabName.icon ?? faQuestion} />
      ) : (
        <Avatar size={24} src={tabName.icon} />
      )}

      <div>{tabName.name}</div>
      <StyledCloseButton
        active={active}
        onClick={(ev) => {
          ev.stopPropagation(); // close button shouldn't reset tab index
          closeTab();
        }}
      >
        <FontAwesomeIcon icon={faX} />
      </StyledCloseButton>
      {active && <Helmet title={tabName.name} />}
    </StyledTab>
  );
}

interface TabbedViewProps {
  tabs: Tabable[];
  children: React.ReactNode;
  surfaceNode: SurfaceLeaf;
  leftBorder?: boolean;
}

// noinspection CssUnknownProperty
const StyledRest = styled.div`
  flex-grow: 1;
  -webkit-app-region: drag;
`;

export const TabBarButton = styled.button`
  border: none;
  margin: 4px 8px 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--chakra-colors-gray-300);
  background-color: transparent;
  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }
`;

const TAB_HEIGHT = 36;

const TabsFlex = styled.div`
  height: ${TAB_HEIGHT}px;
  font-size: 14px;
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

/**
 * A collection of surfaces, with a tab bar at the top.
 */
export const TabbedView = observer(
  ({ children, tabs, surfaceNode }: TabbedViewProps) => {
    const mikoto = useMikoto();
    // used for dragging to the end of the tab bar
    const reorderFn = useReorderable(surfaceNode);
    const setWorkspace = useSetRecoilState(workspaceState);

    const [, drop] = useDrop<TabDnd | ExplorerNode>({
      accept: ['TAB', 'CHANNEL'],
      drop(item) {
        if ('tab' in item) {
          reorderFn(item.dragIndex, -1, item.surfaceLeaf);
        } else {
          surfaceNode.tabs.push(channelToTab(mikoto.channels._get(item.id)!));
          surfaceNode.index = surfaceNode.tabs.length - 1;
        }
      },
    });

    return (
      <Grid
        templateRows={`${TAB_HEIGHT}px calc(100% - ${TAB_HEIGHT}px)`}
        h="100%"
        flex={1}
      >
        <Helmet titleTemplate="%s | Mikoto" defaultTitle="Mikoto" />
        <TabsFlex>
          {tabs.map((tab, index) => (
            <Tab
              tab={tab}
              index={index}
              key={`${tab.kind}/${tab.key}`}
              surfaceNode={surfaceNode}
            />
          ))}
          <StyledRest ref={drop} />
          <TabBarButton
            onClick={() => {
              setWorkspace((ws) => ({
                ...ws,
                rightOpen: !ws.rightOpen,
              }));
            }}
          >
            <FontAwesomeIcon icon={faBarsStaggered} />
          </TabBarButton>
        </TabsFlex>
        {tabs.length ? children : <WelcomeToMikoto />}
      </Grid>
    );
  },
);
