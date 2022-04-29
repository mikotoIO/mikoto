import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Channel } from '../models';
import { ChannelIcon } from './ChannelIcon';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { useDrag, useDrop } from 'react-dnd';

const TabbedViewContainer = styled.div`
  grid-area: main;
  display: grid;
  grid-template-rows: 40px calc(100vh - 40px);
`;

const TabBar = styled.div`
  font-size: 14px;
  height: 44px;
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

  background-color: ${(p) => (p.active ? p.theme.colors.N800 : 'transparent')};

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }

  // ${(p) => p.active && 'border-left: 4px solid #3b83ff;'}
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`;

interface TabItemProps {
  channel: Channel;
  active: boolean;
  onClick: (channel: Channel) => void;
  onClose: (channel: Channel) => void;
}

function TabItem({ channel, active, onClick, onClose }: TabItemProps) {
  const [, drag] = useDrag(() => ({
    type: 'CHANNEL',
    item: { id: channel.id },
  }));

  return (
    <TabItemElement
      ref={drag}
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
  onReorder?: (channel: Channel) => void;
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

  const findChannelCallback = useCallback(
    (id: string) => {
      return channels.find((x) => x.id === id);
    },
    [channels],
  );

  const [, drop] = useDrop({
    accept: 'CHANNEL',
    drop(item) {
      reorderFn(findChannelCallback((item as any).id)!);
    },
  });

  return (
    <TabbedViewContainer>
      <TabBar ref={drop}>
        {channels.map((channel) => (
          <TabItem
            channel={channel}
            active={activeChannelId === channel.id}
            onClick={clickFn}
            onClose={closeFn}
            key={channel.id}
          />
        ))}
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}
