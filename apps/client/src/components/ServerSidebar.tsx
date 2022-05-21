import styled from 'styled-components';
import { useHover } from 'usehooks-ts';
import React, { useRef } from 'react';
import { Button, TextInput, Tooltip } from '@mantine/core';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { useMikoto } from '../api';
import { Space } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { useDelta } from '../hooks';
import { treebarSpaceIdState } from './TreeBar';

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

function ServerIcon({ space }: { space: Space }) {
  const [, setSpaceId] = useRecoilState(treebarSpaceIdState);

  const ref = useRef<HTMLDivElement>(null);
  const isHover = useHover(ref);
  return (
    <Tooltip label={space.name} opened={isHover} position="right" withArrow>
      <ServerIconBase
        ref={ref}
        onClick={() => {
          setSpaceId(space.id);
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

export function ServerSidebar() {
  const mikoto = useMikoto();

  const spaceDelta = useDelta(
    {
      initializer: () => mikoto.getSpaces(),
      predicate: () => true,
    },
    [],
  );

  const spaces = spaceDelta.data;
  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  return (
    <ServerSidebarBase onContextMenu={contextMenu}>
      {spaces.map((space) => (
        <ServerIcon space={space} key={space.id} />
      ))}
    </ServerSidebarBase>
  );
}
