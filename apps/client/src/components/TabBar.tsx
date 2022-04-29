import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';
import { Channel } from '../models';
import { ChannelIcon } from './ChannelIcon';
import { faX } from '@fortawesome/free-solid-svg-icons';

interface TabbedViewProps {
  channels: Channel[];
  activeChannelId?: string;
  children: React.ReactNode;

  onClick?: (channel: Channel) => void;
  onClose?: (channel: Channel) => void;
}

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

const TabItem = styled.div<{ active?: boolean }>`
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

export function TabbedView({
  children,
  channels,
  activeChannelId,
  onClick,
  onClose,
}: TabbedViewProps) {
  const clickFn = onClick ?? (() => {});
  const closeFn = onClose ?? (() => {});

  return (
    <TabbedViewContainer>
      <TabBar>
        {channels.map((channel) => {
          const isActive = activeChannelId === channel.id;
          return (
            <TabItem
              key={channel.id}
              active={isActive}
              onClick={() => {
                clickFn(channel);
              }}
            >
              <ChannelIcon size={20} />
              <div>{channel.name}</div>
              <CloseButton
                active={isActive}
                onClick={(ev) => {
                  ev.stopPropagation();
                  closeFn(channel);
                }}
              >
                <FontAwesomeIcon icon={faX} />
              </CloseButton>
            </TabItem>
          );
        })}
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}
