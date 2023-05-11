import {
  faCheck,
  faGripLinesVertical,
  faX,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  ColorPicker,
  NumberInput,
  SegmentedControl,
  Switch,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Role, Space, Permissions } from 'mikotojs';
import { useState } from 'react';
import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import {
  SidebarContainerArea,
  ViewContainerWithSidebar,
} from '../components/ViewContainer';
import { useMikoto } from '../hooks';

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

function Overview({ space }: { space: Space }) {
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
  display: grid;
  width: 100%;
  grid-template-columns: 200px auto;
  height: 100%;
`;

const RoleList = styled.div``;

function TriStateSelector() {
  const [value, setValue] = useState<string>('U');

  return (
    <SegmentedControl
      value={value}
      onChange={setValue}
      color={
        {
          Y: 'green',
          U: 'gray',
          N: 'red',
        }[value]
      }
      data={[
        {
          value: 'Y',
          label: <FontAwesomeIcon icon={faCheck} width={32} />,
        },
        {
          value: 'U',
          label: <FontAwesomeIcon icon={faGripLinesVertical} width={32} />,
        },
        {
          value: 'N',
          label: <FontAwesomeIcon icon={faX} width={32} />,
        },
      ]}
    />
  );
}

const PermissionBox = styled.div`
  display: flex;
  justify-content: space-between;
`;

const rolePermissionData = [
  { name: 'Superuser', permission: Permissions.space.superuser },
  { name: 'Manage Space', permission: Permissions.space.manageSpace },
  { name: 'Manage Channel', permission: Permissions.space.manageChannels },
  { name: 'Manage Roles', permission: Permissions.space.manageRoles },
];

function RolePermissionEditor({
  permissions,
  onChange,
}: {
  permissions: string;
  onChange?: (x: string) => void;
}) {
  const [roleInt, setRoleInt] = useState(BigInt(permissions));

  return (
    <div>
      {rolePermissionData.map((x) => (
        <PermissionBox key={x.permission.toString()}>
          <h3>{x.name}</h3>
          <Switch
            size="lg"
            checked={Permissions.check(x.permission, roleInt)}
            onChange={() => {
              // eslint-disable-next-line no-bitwise
              const newVal = x.permission ^ roleInt;
              setRoleInt(newVal);
              onChange?.(newVal.toString());
            }}
          />
        </PermissionBox>
      ))}
    </div>
  );
}

const StyledRoleEditor = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
`;

function RoleEditor({ role, space }: { space: Space; role: Role }) {
  const mikoto = useMikoto();
  const { getInputProps, values, setFieldValue } = useForm({
    initialValues: {
      name: role.name,
      color: role.color,
      position: role.position,
      permissions: role.permissions,
    },
  });
  return (
    <StyledRoleEditor>
      {role.name !== '@everyone' && (
        <div>
          <h2>Edit Role</h2>
          <TextInput label="Role Name" {...getInputProps('name')} />
          <NumberInput label="Role Priority" {...getInputProps('position')} />
          <ColorPicker {...getInputProps('color')} />
        </div>
      )}

      <RolePermissionEditor
        permissions={role.permissions}
        onChange={(perm) => {
          setFieldValue('permissions', perm);
        }}
      />
      <Button
        onClick={() => {
          // mikoto
          //   .editRole(space.id, role.id, {
          //     name: values.name,
          //     position: values.position,
          //     spacePermissions: values.permissions,
          //     color: values.color ?? undefined,
          //   })
          //   .then(() => console.log('updated'));
        }}
      >
        Save Changes
      </Button>
    </StyledRoleEditor>
  );
}

function Roles({ space }: { space: Space }) {
  // const rolesDelta = useDelta(space.roles, [space.id]);
  const mikoto = useMikoto();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const role = space.roles.find((x) => x.id === selectedRoleId);
  // const role = rolesDelta.data.find((x) => x.id === selectedRoleId);
  return (
    <RoleEditorGrid>
      <RoleList>
        <Button
          onClick={() => {
            // mikoto.client.roles.create(space.id, 'New Role').then(() => {
            //   console.log('role created');
            // });
          }}
        >
          New Role
        </Button>
        {space.roles.map((r) => (
          <SidebarButton
            key={r.id}
            selected={selectedRoleId === r.id}
            onClick={() => setSelectedRoleId(r.id)}
          >
            <ColorDot color={r.color ?? undefined} />
            {r.name}
          </SidebarButton>
        ))}
      </RoleList>
      {role && <RoleEditor role={role} space={space} key={role.id} />}
    </RoleEditorGrid>
  );
}

function SettingSwitch({ tab, space }: { tab: string; space: Space }) {
  switch (tab) {
    case 'Overview':
      return <Overview space={space} />;
    case 'Roles':
      return <Roles space={space} />;
    default:
      return null;
  }
}

export function SpaceSettingsView({ space }: { space: Space }) {
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
