import styled from 'styled-components';
import { useHover } from 'usehooks-ts';
import React, { useRef } from 'react';
import { Button, TextInput, Tooltip } from '@mantine/core';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { ClientSpace, useMikoto } from '../api';
import { Space } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { treebarSpaceState, useTabkit } from '../store';
import { useDelta } from '../hooks/useDelta';

const ServerSidebarBase = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(p) => p.theme.colors.N1000};
  align-items: center;
  width: 64px;
  height: 100%;
  padding-top: 10px;
`;

const ServerIconBase = styled.div`
  margin-bottom: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.N800};
`;

function ServerIconContextMenu({
  space,
  destroy,
}: {
  space: Space;
  destroy: () => void;
}) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () => {
          tabkit.openTab(
            {
              kind: 'spaceSettings',
              name: `Settings: ${space.name}`,
              key: space.id,
              space,
            },
            true,
          );
          destroy();
        }}
      >
        Space Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => {
          await navigator.clipboard.writeText(space.id);
          destroy();
        }}
      >
        Copy ID
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => {
          destroy();
          await mikoto.deleteSpace(space.id);
        }}
      >
        Delete Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

function ServerIcon({ space }: { space: Space }) {
  const [, setSpace] = useRecoilState(treebarSpaceState);

  const ref = useRef<HTMLDivElement>(null);
  const isHover = useHover(ref);
  const contextMenu = useContextMenu(({ destroy }) => (
    <ServerIconContextMenu space={space} destroy={destroy} />
  ));

  return (
    <Tooltip label={space.name} opened={isHover} position="right" withArrow>
      <ServerIconBase
        onContextMenu={contextMenu}
        ref={ref}
        onClick={() => {
          setSpace(space instanceof ClientSpace ? space.simplify() : space);
        }}
      >
        {space.name[0]}
      </ServerIconBase>
    </Tooltip>
  );
}

function CreateSpaceModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const form = useForm({
    initialValues: {
      spaceName: '',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await mikoto.createSpace(form.values.spaceName);
        setModal(null);
        form.reset();
      })}
    >
      <TextInput
        label="Space Name"
        placeholder="Awesomerino Space"
        {...form.getInputProps('spaceName')}
      />
      <Button mt={16} fullWidth type="submit">
        Create Space
      </Button>
    </form>
  );
}

function ServerSidebarContextMenu() {
  const setModal = useSetRecoilState(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            title: 'Create Space',
            elem: <CreateSpaceModal />,
          });
        }}
      >
        Create Space
      </ContextMenu.Link>
      <ContextMenu.Link>Join Space</ContextMenu.Link>
    </ContextMenu>
  );
}

export function SpaceJoinModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  const form = useForm({
    initialValues: {
      spaceId: '',
    },
  });
  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await mikoto.joinSpace(form.values.spaceId);
        setModal(null);
        form.reset();
      })}
    >
      <TextInput
        label="Space ID"
        placeholder="9a807e83-15db-4267-9940-cdda7cb696fd"
        {...form.getInputProps('spaceId')}
      />
      <Button mt={16} fullWidth type="submit">
        Join Space
      </Button>
    </form>
  );
}

export function ServerSidebar() {
  const setModal = useSetRecoilState(modalState);

  const mikoto = useMikoto();
  const spaceDelta = useDelta(mikoto.spaces, []);

  const spaces = spaceDelta.data;
  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  return (
    <ServerSidebarBase onContextMenu={contextMenu}>
      {spaces.map((space) => (
        <ServerIcon space={space} key={space.id} />
      ))}
      <ServerIconBase
        onClick={() => {
          setModal({
            title: 'Join Space',
            elem: <SpaceJoinModal />,
          });
        }}
      >
        +
      </ServerIconBase>
    </ServerSidebarBase>
  );
}
