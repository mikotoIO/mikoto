import React, { useContext, useRef } from 'react';
import styled from 'styled-components';
import { useDrag, useDrop } from 'react-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { useRecoilState, useRecoilValue } from 'recoil';

import { getTabIcon, IconBox } from './atoms/IconBox';
import { Tabable, tabbedState, TabContext, tabNameFamily } from '../store';

const StyledTabbedView = styled.div`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N1000};
  display: grid;
  grid-template-rows: 40px calc(100vh - 40px);
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

export function TabName({ name }: { name: string }) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useRecoilState(tabNameFamily(tabInfo.key));
  if (tabName !== name) {
    setTabName(name);
  }
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
      onAuxClick={() => {
        closeTab();
      }}
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
`;

function WelcomeToMikoto() {
  return (
    <StyledWelcome>
      <MikotoLogo src="/logo.svg" />
      <h1>Welcome to Mikoto!</h1>
    </StyledWelcome>
  );
}

export function TabbedView({ children, tabs }: TabbedViewProps) {
  const reorderFn = useReorderable();

  const [, drop] = useDrop<TabDnd>({
    accept: 'TAB',
    drop(item) {
      reorderFn(item.dragIndex, -1);
    },
  });

  return (
    <StyledTabbedView>
      <StyledTabBar>
        {tabs.map((tab, index) => (
          <Tab tab={tab} index={index} key={`${tab.kind}/${tab.key}`} />
        ))}
        <StyledRest ref={drop} />
      </StyledTabBar>
      {tabs.length ? children : <WelcomeToMikoto />}
    </StyledTabbedView>
  );
}
