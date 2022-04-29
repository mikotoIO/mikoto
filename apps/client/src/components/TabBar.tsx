import React from 'react';
import styled from 'styled-components';
import { Channel } from '../models';

interface TabbedViewProps {
  channels: Channel[];
  activeChannelId?: string;
  children: React.ReactNode;
}

const TabbedViewContainer = styled.div`
  grid-area: main;
  display: grid;
  grid-template-rows: 36px calc(100vh - 36px);
`;

const TabBar = styled.div`
  font-size: 14px;
  height: 36px;
  display: flex;
`;

const TabItem = styled.div<{ active?: boolean }>`
  height: 100%;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: ${(p) => (p.active ? p.theme.colors.N800 : 'transparent')};
  ${(p) => p.active && 'border-left: 4px solid #3b83ff;'}
`;

export function TabbedView({
  children,
  channels,
  activeChannelId,
}: TabbedViewProps) {
  return (
    <TabbedViewContainer>
      <TabBar>
        {channels.map((channel) => (
          <TabItem key={channel.id} active={activeChannelId === channel.id}>
            {channel.name}
          </TabItem>
        ))}
      </TabBar>
      {children}
    </TabbedViewContainer>
  );
}
