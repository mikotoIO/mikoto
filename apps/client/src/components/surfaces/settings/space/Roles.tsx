/* eslint-disable no-bitwise */
import {
  Box,
  Button,
  ButtonGroup,
  Circle,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Switch,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCirclePlus, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { checkPermission, permissions } from '@mikoto-io/permcheck';
import { ClientSpace, Role, Space } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';

import { useContextMenu } from '@/components/ContextMenu';
import { useMikoto } from '@/hooks';
import { Form } from '@/ui';
import { SettingsView } from '@/views';

const SidebarButton = styled.a<{ selected?: boolean }>`
  display: block;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${(p) =>
    p.selected ? 'var(--chakra-colors-gray-650)' : 'transparent'};
  color: ${(p) => (p.selected ? 'white' : 'rgba(255,255,255,0.8)')};
  user-select: none;
`;

const rolePermissionData = [
  { name: 'Superuser', permission: permissions.superuser },
  { name: 'Manage Space', permission: permissions.manageSpace },
  { name: 'Manage Channel', permission: permissions.manageChannels },
  { name: 'Manage Roles', permission: permissions.manageRoles },
];

const StyledColorPicker = styled(HexColorPicker)`
  &.react-colorful {
    height: 150px;
  }
`;

type ColorPickerProps = Partial<{
  value: string | null;
  onChange: (x: string | null) => void;
}>;

const defaultColors = [
  '#F80688',
  '#AD0DF2',
  '#006FFF',
  '#00D68B',
  '#FF981A',
  '#f72649',
];

function RoleColorPicker({ value, onChange }: ColorPickerProps) {
  const menu = useContextMenu(() => (
    <StyledColorPicker color={value ?? '#006FFF'} onChange={onChange} />
  ));
  return (
    <Flex py={4} gap={2}>
      <Box w={16} h={16} bg={value ?? 'gray.300'} rounded={4} onClick={menu} />
      <Flex
        align="center"
        justify="center"
        fontSize="32px"
        w="64px"
        h="64px"
        bg="gray.200"
        color="gray.300"
        rounded={4}
        onClick={() => {
          onChange?.(null);
        }}
      >
        <FontAwesomeIcon icon={faCircleXmark} />
      </Flex>
      <Flex gap={2}>
        {defaultColors.map((x) => (
          <Box
            w={8}
            h={8}
            bg={x}
            rounded="md"
            key={x}
            onClick={() => onChange?.(x)}
          />
        ))}
      </Flex>
    </Flex>
  );
}

function RolePermissionEditor({
  perms,
  onChange,
}: {
  perms: string;
  onChange?: (x: string) => void;
}) {
  const perm = BigInt(perms);

  return (
    <Box>
      {rolePermissionData.map((x) => (
        <Box py={4} key={x.permission.toString()}>
          <Flex justifyContent="space-between">
            <Heading as="h3" m={0} fontSize="lg">
              {x.name}
            </Heading>
            <Switch
              size="lg"
              isChecked={checkPermission(x.permission, perm)}
              onChange={(t) => {
                // if X is true, switch the bitset to 1
                // if X is false, switch the bitset to 0

                if (t.target.checked) {
                  onChange?.((perm | x.permission).toString());
                } else {
                  onChange?.((perm & ~x.permission).toString());
                }
              }}
            />
          </Flex>
          <Box color="gray.200">Description of the perm goes here.</Box>
        </Box>
      ))}
    </Box>
  );
}

const StyledRoleEditor = styled(Form)`
  overflow-y: scroll;
`;

const RoleEditor = observer(({ role, space }: { space: Space; role: Role }) => {
  const mikoto = useMikoto();
  const form = useForm({
    defaultValues: {
      name: role.name,
      position: role.position,
    },
  });
  const [perms, setPerms] = useState(role.permissions);
  const [color, setColor] = useState<string | null>(role.color);

  return (
    <StyledRoleEditor
      p={16}
      h="100%"
      onSubmit={form.handleSubmit((d) => {
        const data = { ...d, permissions: perms, color };
        mikoto.client.roles
          .edit({
            spaceId: space.id,
            roleId: role.id,
            options: data,
          })
          .then(() => {});
      })}
    >
      <h2>Edit {role.name}</h2>

      {role.name !== '@everyone' && (
        <>
          <FormControl>
            <FormLabel>Role Name</FormLabel>
            <Input {...form.register('name')} />
          </FormControl>
          <FormControl>
            <FormLabel>Role Priority</FormLabel>
            <Input
              type="number"
              min={0}
              max={99}
              {...form.register('position', { valueAsNumber: true })}
            />
          </FormControl>
          <RoleColorPicker value={color} onChange={setColor} />
        </>
      )}

      <RolePermissionEditor perms={perms} onChange={setPerms} />
      <ButtonGroup>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
        {role.name !== '@everyone' && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              mikoto.client.roles
                .delete({
                  spaceId: space.id,
                  roleId: role.id,
                })
                .then(() => {});
            }}
          >
            Delete Role
          </Button>
        )}
      </ButtonGroup>
    </StyledRoleEditor>
  );
});

export const RolesSubsurface = observer(({ space }: { space: ClientSpace }) => {
  const mikoto = useMikoto();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const role = space.roles.find((x) => x.id === selectedRoleId);
  // const role = rolesDelta.data.find((x) => x.id === selectedRoleId);
  return (
    <SettingsView style={{ paddingRight: 0 }}>
      <Grid w="100%" h="100%" templateColumns="200px auto">
        <Box pr={4}>
          <Button
            my={4}
            leftIcon={<FontAwesomeIcon icon={faCirclePlus} />}
            variant="primary"
            onClick={async () => {
              await mikoto.client.roles.create({
                spaceId: space.id,
                name: 'New Role',
              });
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
              <Circle
                display="inline-block"
                size="12px"
                mr="12px"
                bg={r.color ?? '#99AAB5'}
              />
              {r.name}
            </SidebarButton>
          ))}
        </Box>
        {role && <RoleEditor role={role} space={space} key={role.id} />}
      </Grid>
    </SettingsView>
  );
});
