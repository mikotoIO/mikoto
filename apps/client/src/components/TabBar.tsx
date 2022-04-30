import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import styled from 'styled-components';
import { Channel } from '../models';
import { ChannelIcon } from './ChannelIcon';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { useDrag, useDrop } from 'react-dnd';

const TabbedViewContainer = styled.div`
  background-color: ${(p) => p.theme.colors.N1000};
  grid-area: main;
  display: grid;
  grid-template-rows: 40px calc(100vh - 40px);
`;

const TabBar = styled.div`
  font-size: 14px;
  height: 40px;
  display: flex;
`;

const CloseButton = styled.div<{ active?: boolean }>`
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

const TabItemElement = styled.div<{ active?: boolean }>`
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

interface TabItemProps {
  channel: Channel;
  active: boolean;
  index: number;
  onClick: (channel: Channel) => void;
  onClose: (channel: Channel) => void;
  onReorder: (channel: Channel, dragIndex: number, dropIndex: number) => void;
}

interface TabDndItem {
  channel: Channel;
  dragIndex: number;
}

function TabItem({
  channel,
  active,
  onClick,
  onClose,
  onReorder,
  index,
}: TabItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drag] = useDrag<TabDndItem>({
    type: 'CHANNEL',
    item: { channel, dragIndex: index },
  });
  const [, drop] = useDrop<TabDndItem>({
    accept: 'CHANNEL',
    drop(item) {
      onReorder(item.channel, item.dragIndex, index);
    },
  });
  drag(drop(ref));

  return (
    <TabItemElement
      ref={ref}
      key={channel.id}
      active={active}
      onClick={() => {
        onClick(channel);
      }}
    >
      <ChannelIcon size={20} />
      <div>{channel.name}</div>
      <CloseButton
        active={active}
        onClick={(ev) => {
          ev.stopPropagation();
          onClose(channel);
        }}
      >
        <FontAwesomeIcon icon={faX} />
      </CloseButton>
    </TabItemElement>
  );
}

interface TabbedViewProps {
  channels: Channel[];
  activeChannelId?: string;
  children: React.ReactNode;

  onClick?: (channel: Channel) => void;
  onClose?: (channel: Channel) => void;
  onReorder?: (channel: Channel, dragIndex: number, dropIndex: number) => void;
}

const DropRest = styled.div`
  flex-grow: 1;
`;

const WelcomeContainer = styled.div`
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
    <WelcomeContainer>
      <MikotoLogo src="/logo.svg" />
      <h1>Welcome to Mikoto!</h1>
    </WelcomeContainer>
  );
}

export function TabbedView({
  children,
  channels,
  activeChannelId,
  onClick,
  onClose,
  onReorder,
}: TabbedViewProps) {
  const clickFn = onClick ?? (() => {});
  const closeFn = onClose ?? (() => {});
  const reorderFn = onReorder ?? (() => {});

  const [, drop] = useDrop<TabDndItem>({
    accept: 'CHANNEL',
    drop(item) {
      reorderFn(item.channel, 0, -1);
    },
  });

  return (
    <TabbedViewContainer>
      <TabBar>
        {channels.map((channel, index) => (
          <TabItem
            channel={channel}
            active={activeChannelId === channel.id}
            onClick={clickFn}
            onClose={closeFn}
            onReorder={reorderFn}
            index={index}
            key={channel.id}
          />
        ))}
        <DropRest ref={drop} />
      </TabBar>
      {channels.length ? children : <WelcomeToMikoto />}
    </TabbedViewContainer>
  );
}
