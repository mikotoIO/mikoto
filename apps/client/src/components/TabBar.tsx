import { faX, faBarsStaggered } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Helmet } from 'react-helmet';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import {
  rightBarOpenState,
  Tabable,
  tabbedState,
  TabContext,
  tabNameFamily,
} from '../store';
import { getTabIcon, IconBox } from './atoms/IconBox';

const StyledTabbedView = styled.div`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N1000};
  display: grid;
  height: 100%;
  grid-template-rows: 40px calc(100% - 40px);
`;

const StyledTabBar = styled.div`
  font-size: 14px;
  height: 40px;
  display: flex;
`;

const StyledCloseButton = styled.div<{ active?: boolean }>`
  margin-left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  height: 100%;
  padding: 0 8px 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: ${(p) =>
    p.active ? p.theme.colors.N800 : p.theme.colors.N900};

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }

  // ${(p) => p.active && 'border-left: 4px solid #3b83ff;'}
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`;

interface TabProps {
  tab: Tabable;
  index: number;
}

interface TabDnd {
  tab: Tabable;
  dragIndex: number;
}

function useReorderable() {
  const [tabbed, setTabbed] = useRecoilState(tabbedState);

  return (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;

    const filteredTabs = [...tabbed.tabs];
    const nt = filteredTabs.splice(dragIndex, 1)[0];

    if (dropIndex === -1) {
      setTabbed(({ tabs }) => ({
        index: tabs.length - 1,
        tabs: [...filteredTabs, nt],
      }));
    } else {
      filteredTabs.splice(dropIndex, 0, nt);
      setTabbed({
        index: dropIndex,
        tabs: filteredTabs,
      });
    }
  };
}

// TODO: The fuck was I on when I wrote this code?
export function TabName({ name }: { name: string }) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useRecoilState(tabNameFamily(tabInfo.key));
  useEffect(() => {
    if (tabName !== name) {
      setTabName(name);
    }
  }, [name]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}

function Tab({ tab, index }: TabProps) {
  const [tabbed, setTabbed] = useRecoilState(tabbedState);
  const reorderFn = useReorderable();
  const tabName = useRecoilValue(tabNameFamily(`${tab.kind}/${tab.key}`));

  const ref = useRef<HTMLDivElement>(null);
  const [, drag] = useDrag<TabDnd>({
    type: 'TAB',
    item: { tab, dragIndex: index },
  });
  const [, drop] = useDrop<TabDnd>({
    accept: 'TAB',
    drop(item) {
      reorderFn(item.dragIndex, index);
    },
  });
  drag(drop(ref));

  const active = index === tabbed.index;

  const closeTab = () => {
    setTabbed(({ tabs, index: idx }) => {
      const xsc = [...tabs];
      xsc.splice(index, 1);
      return {
        index: idx,
        tabs: xsc,
      };
    });
    if (index <= tabbed.index) {
      setTabbed(({ tabs }) => ({
        index: Math.max(0, index - 1),
        tabs,
      }));
    }
  };

  return (
    <StyledTab
      ref={ref}
      key={tab.key}
      active={active}
      onClick={() => {
        setTabbed(({ tabs }) => ({ index, tabs }));
      }}
      onAuxClick={() => {}}
    >
      <IconBox size={20} icon={getTabIcon(tab)} />
      <div>{tabName}</div>
      <StyledCloseButton
        active={active}
        onClick={(ev) => {
          ev.stopPropagation(); // close button shouldn't reset tab index
          closeTab();
        }}
      >
        <FontAwesomeIcon icon={faX} />
      </StyledCloseButton>
      {active && <Helmet title={tabName} />}
    </StyledTab>
  );
}

interface TabbedViewProps {
  tabs: Tabable[];
  children: React.ReactNode;
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

const RightSidebarButton = styled.button`
  border: none;
  margin-top: 4px;
  margin-right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--N400);
  background-color: transparent;
  &:hover {
    background-color: var(--N800);
  }
`;

export function TabbedView({ children, tabs }: TabbedViewProps) {
  const reorderFn = useReorderable();
  const setRightBarOpen = useSetRecoilState(rightBarOpenState);

  const [, drop] = useDrop<TabDnd>({
    accept: 'TAB',
    drop(item) {
      reorderFn(item.dragIndex, -1);
    },
  });

  return (
    <StyledTabbedView>
      <Helmet titleTemplate="Mikoto | %s" defaultTitle="Mikoto" />
      <StyledTabBar>
        {tabs.map((tab, index) => (
          <Tab tab={tab} index={index} key={`${tab.kind}/${tab.key}`} />
        ))}
        <StyledRest ref={drop} />
        <RightSidebarButton
          onClick={() => {
            setRightBarOpen((x) => !x);
          }}
        >
          <FontAwesomeIcon icon={faBarsStaggered} />
        </RightSidebarButton>
      </StyledTabBar>
      {tabs.length ? children : <WelcomeToMikoto />}
    </StyledTabbedView>
  );
}
