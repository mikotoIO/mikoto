import { Input, Form, Button, Buttons, Modal, Toggle } from '@mikoto-io/lucid';
import { Role, Space, Permissions } from 'mikotojs';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { TabName } from '../../TabBar';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../../molecules/AvatarEditor';

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

function AddBotModal() {
  return (
    <Modal>
      <Form>
        <Input labelName="Bot ID" />
        <Button>Submit</Button>
      </Form>
    </Modal>
  );
}

function Overview({ space }: { space: Space }) {
  const [spaceName, setSpaceName] = useState(space.name);
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  return (
    <SettingsView>
      <TabName name={`Settings for ${space.name}`} />
      <Form>
        <h1>Space Overview</h1>
        <AvatarEditor
          onDrop={async (file) => {
            const { data } = await uploadFileWithAxios<{ url: string }>(
              mediaServerAxios,
              '/spaceicon',
              file,
            );
            await mikoto.client.spaces.update(space.id, {
              icon: data.url,
              name: null,
            });
          }}
        />

        <Input
          labelName="Space Name"
          value={spaceName}
          onChange={(x) => setSpaceName(x.target.value)}
        />
        <Buttons>
          <Button variant="primary">Update</Button>
          <Button
            role="button"
            onClick={(e) => {
              setModal({
                elem: <AddBotModal />,
              });
              e.preventDefault();
            }}
          >
            Add Bot
          </Button>
        </Buttons>
      </Form>
    </SettingsView>
  );
}

function Invites({ space }: { space: Space }) {
  return (
    <SettingsView>
      <h1>Invites</h1>
    </SettingsView>
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
          <Toggle />
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
  const form = useForm({
    defaultValues: {
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
          <Input labelName="Role Name" {...form.register('name')} />
          {/* <NumberInput label="Role Priority" {...form.register('position')} />
          <ColorPicker {...form.register('color')} /> */}
        </div>
      )}

      <RolePermissionEditor
        permissions={role.permissions}
        onChange={(perm) => {
          form.setValue('permissions', perm);
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

function SettingSwitch({ nav, space }: { nav: string; space: Space }) {
  switch (nav) {
    case 'Overview':
      return <Overview space={space} />;
    case 'Invites':
      return <Invites space={space} />;
    case 'Roles':
      return <Roles space={space} />;
    default:
      return null;
  }
}

const CATEGORIES = ['Overview', 'Invites', 'Roles'];

export function SpaceSettingsView({ space }: { space: Space }) {
  const [nav, setNav] = useState('Overview');
  return (
    <SettingsView.Container>
      <SettingsView.Sidebar>
        {CATEGORIES.map((c) => (
          <SettingsView.Nav
            active={nav === c}
            onClick={() => {
              setNav(c);
            }}
            key={c}
          >
            {c}
          </SettingsView.Nav>
        ))}
      </SettingsView.Sidebar>
      <SettingSwitch nav={nav} space={space} />
    </SettingsView.Container>
  );
}
