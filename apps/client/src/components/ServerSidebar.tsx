import { Button, TextInput, Tooltip } from '@mantine/core';
import { AxiosError } from 'axios';
import { Space } from 'mikotojs';
import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import { useHover } from 'usehooks-ts';

import { useMikoto } from '../hooks';
import { useDeltaNext, useDeltaWithRecoil } from '../hooks/useDelta';
import { useErrorElement } from '../hooks/useErrorElement';
import { treebarSpaceState, useTabkit } from '../store';
import { spacesState } from '../store/cache';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { Pill } from './atoms/Pill';

const StyledServerSidebar = styled.div`
  background-color: ${(p) => p.theme.colors.N1000};
  align-items: center;
  width: 68px;
  height: 100%;
  padding-top: 10px;
`;

const StyledServerIcon = styled.div<{ active?: boolean }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => (p.active ? 16 : 100)}px;
  background-color: ${(p) => p.theme.colors.N800};
  transition-duration: 100ms;
`;

function ServerIconContextMenu({ space }: { space: Space }) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () =>
          tabkit.openTab(
            {
              kind: 'spaceSettings',
              key: space.id,
              space,
            },
            true,
          )
        }
      >
        Space Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => await navigator.clipboard.writeText(space.id)}
      >
        Copy ID
      </ContextMenu.Link>
      <ContextMenu.Link onClick={async () => await mikoto.leaveSpace(space.id)}>
        Leave Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

const StyledIconWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  width: 68px;
`;

function ServerIcon({ space }: { space: Space }) {
  const [stateSpace, setSpace] = useRecoilState(treebarSpaceState);
  const isActive = stateSpace?.id === space.id;

  const ref = useRef<HTMLDivElement>(null);
  const isHover = useHover(ref);
  const contextMenu = useContextMenu(() => (
    <ServerIconContextMenu space={space} />
  ));

  return (
    <Tooltip label={space.name} opened={isHover} position="right" withArrow>
      <StyledIconWrapper>
        <Pill h={isActive ? 32 : 8} />
        <StyledServerIcon
          active={isActive}
          onContextMenu={contextMenu}
          ref={ref}
          onClick={() => {
            setSpace(space);
          }}
        >
          {space.name[0]}
        </StyledServerIcon>
      </StyledIconWrapper>
    </Tooltip>
  );
}

function CreateSpaceModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const form = useForm();

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        await mikoto.createSpace(data.spaceName);
        setModal(null);
        form.reset();
      })}
    >
      <TextInput
        label="Space Name"
        placeholder="Awesomerino Space"
        {...form.register('spaceName')}
      />
      <Button mt={16} fullWidth type="submit">
        Create Space
      </Button>
    </form>
  );
}

export function SpaceJoinModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  const { register, formState, handleSubmit, reset } = useForm({});
  const error = useErrorElement();

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          await mikoto.joinSpace(data.spaceId);
          setModal(null);
          reset();
        } catch (e) {
          error.setError((e as AxiosError).response?.data as any);
        }
      })}
    >
      {error.el}
      <TextInput
        label="Space ID"
        placeholder="9a807e83-15db-4267-9940-cdda7cb696fd"
        {...register('spaceId')}
      />
      <Button mt={16} fullWidth type="submit" loading={formState.isSubmitting}>
        Join Space
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
      <ContextMenu.Link
        onClick={() => {
          setModal({
            title: 'Join Space',
            elem: <SpaceJoinModal />,
          });
        }}
      >
        Join Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

export function ServerSidebar() {
  const setModal = useSetRecoilState(modalState);

  const mikoto = useMikoto();
  const spaceDelta = useDeltaWithRecoil<Space>(
    spacesState,
    mikoto.spaceEmitter,
    '@',
    () => {
      return mikoto.client.spaces.list();
    },
    [],
  );
  // const spaceDelta = useDelta(mikoto.spaces, []);

  const spaces = spaceDelta.data;
  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  return (
    <StyledServerSidebar onContextMenu={contextMenu}>
      {spaces.map((space) => (
        <ServerIcon space={space} key={space.id} />
      ))}
      <StyledIconWrapper>
        <StyledServerIcon
          onClick={() => {
            setModal({
              title: 'Join Space',
              elem: <SpaceJoinModal />,
            });
          }}
        >
          +
        </StyledServerIcon>
      </StyledIconWrapper>
    </StyledServerSidebar>
  );
}
