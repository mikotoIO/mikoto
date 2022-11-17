import { TextInput } from '@mantine/core';
import { useState } from 'react';
import styled from 'styled-components';
import {
  SidebarContainerArea,
  ViewContainerWithSidebar,
} from '../components/ViewContainer';
import { TabName } from '../components/TabBar';
import { ClientSpace } from '../api/entities/ClientSpace';
import { useDelta } from '../hooks/useDelta';

const Sidebar = styled.div`
  padding: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
`;

const SidebarButton = styled.a<{ selected?: boolean }>`
  display: block;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${(p) =>
    p.selected ? p.theme.colors.N700 : 'transparent'};
  color: ${(p) => (p.selected ? 'white' : 'rgba(255,255,255,0.8)')};
  user-select: none;
`;

function Overview({ space }: { space: ClientSpace }) {
  const [spaceName, setSpaceName] = useState(space.name);

  return (
    <SidebarContainerArea>
      <TabName name={`Settings for ${space.name}`} />
      <h1>Space Overview</h1>
      <TextInput
        value={spaceName}
        onChange={(x) => setSpaceName(x.target.value)}
      />
    </SidebarContainerArea>
  );
}

const ColorDot = styled.span<{ color?: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 12px;
  border-radius: 999px;
  background-color: ${(p) => p.color ?? '#99AAB5'};
`;

const RoleEditorGrid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: 200px auto;
`;

const RoleList = styled.div``;

function Roles({ space }: { space: ClientSpace }) {
  const rolesDelta = useDelta(space.roles, [space.id]);
  return (
    <RoleEditorGrid>
      <RoleList>
        {rolesDelta.data.map((role) => (
          <SidebarButton key={role.id}>
            <ColorDot />
            {role.name}
          </SidebarButton>
        ))}
      </RoleList>
    </RoleEditorGrid>
  );
}

function SettingSwitch({ tab, space }: { tab: string; space: ClientSpace }) {
  switch (tab) {
    case 'Overview':
      return <Overview space={space} />;
    case 'Roles':
      return <Roles space={space} />;
    default:
      return null;
  }
}

export function SpaceSettingsView({ space }: { space: ClientSpace }) {
  const [tab, setTab] = useState('Overview');
  return (
    <ViewContainerWithSidebar>
      <Sidebar>
        {['Overview', 'Roles'].map((x) => (
          <SidebarButton
            selected={tab === x}
            key={x}
            onClick={() => {
              setTab(x);
            }}
          >
            {x}
          </SidebarButton>
        ))}
      </Sidebar>
      <SettingSwitch tab={tab} space={space} />
    </ViewContainerWithSidebar>
  );
}
