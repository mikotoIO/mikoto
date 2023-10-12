import {
  faX,
  faBarsStaggered,
  faQuestion,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Flex, Grid } from '@mikoto-io/lucid';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Helmet } from 'react-helmet';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled, { css } from 'styled-components';

import { useMikoto } from '../hooks';
import { workspaceState } from '../store';
import {
  SurfaceLeaf,
  TabContext,
  Tabable,
  pruneNode,
  splitNode,
  surfaceStore,
  tabNameFamily,
} from '../store/surface';
import { ContextMenu, useContextMenu } from './ContextMenu';
import { channelToTab } from './Explorer';
import { NodeObject } from './ExplorerNext';
import { IconBox } from './atoms/IconBox';

const StyledCloseButton = styled(Flex)<{ active?: boolean }>`
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
  user-select: none;
  cursor: pointer;
  padding: 0 8px 0 20px;
  display: flex;
  flex-shrink: 0;
  border-bottom: 2px solid
    ${(p) => (p.active ? 'var(--color-primary)' : 'transparent')};
  align-items: center;
  justify-content: center;

  background-color: ${(p) => (p.active ? 'var(--N800)' : 'var(--N900)')};

  &:hover {
    background-color: var(--N700);
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

function useReorderable(destinationSurface: SurfaceLeaf) {
  return (dragIndex: number, dropIndex: number, originSurface: SurfaceLeaf) => {
    // if (dragIndex === dropIndex) return;

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

interface TabNameProps {
  name: string;
  icon?: IconDefinition;
}

// TODO: This is still bugged. Cause unknown. Please fix.
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
      <IconBox size={20} icon={tabName.icon ?? faQuestion} />
      <div>{tabName.name}</div>
      <StyledCloseButton
        center
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

const StyledWelcome = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.6);
`;

const MikotoLogo = styled.img`
  width: 220px;
  mix-blend-mode: overlay;
  opacity: 0.4;
`;

function WelcomeToMikoto() {
  return (
    <StyledWelcome>
      <MikotoLogo src="/logo/logo.svg" />
      {/* <h1>Welcome to Mikoto!</h1> */}
    </StyledWelcome>
  );
}

export const TabBarButton = styled.button`
  border: none;
  margin: 4px 8px 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--N400);
  background-color: transparent;
  &:hover {
    background-color: var(--N800);
  }
`;

const TabsFlex = styled(Flex)`
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

export const TabbedView = observer(
  ({ children, tabs, surfaceNode }: TabbedViewProps) => {
    const mikoto = useMikoto();
    const reorderFn = useReorderable(surfaceNode);
    const setWorkspace = useSetRecoilState(workspaceState);

    const [, drop] = useDrop<TabDnd | NodeObject>({
      accept: ['TAB', 'CHANNEL'],
      drop(item) {
        if ('tab' in item) {
          reorderFn(item.dragIndex, -1, item.surfaceLeaf);
        } else {
          surfaceNode.tabs.push(channelToTab(mikoto.channels.get(item.id)!));
          surfaceNode.index = surfaceNode.tabs.length - 1;
        }
      },
    });

    return (
      <Grid
        trow="40px calc(100% - 40px)"
        h="100%"
        bg="N1000"
        style={{ flex: 1 }}
      >
        <Helmet titleTemplate="Mikoto | %s" defaultTitle="Mikoto" />
        <TabsFlex h={40} fs={14}>
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
