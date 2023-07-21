import { TextInput, Tooltip } from '@mantine/core';
import { Button, Form, Input, Modal } from '@mikoto-io/lucid';
import { AxiosError } from 'axios';
import { Space } from 'mikotojs';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import { useHover } from 'usehooks-ts';

import { env } from '../env';
import { useMikoto } from '../hooks';
import { useDeltaWithRedux } from '../hooks/useDelta';
import { useErrorElement } from '../hooks/useErrorElement';
import { useMikotoSelector } from '../redux';
import { spaceActions } from '../redux/mikoto';
import { treebarSpaceState, useTabkit } from '../store';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { Pill } from './atoms/Pill';
import { StyledSpaceIcon } from './atoms/SpaceIcon';

const StyledServerSidebar = styled.div`
  background-color: ${(p) => p.theme.colors.N1000};
  align-items: center;
  box-sizing: border-box;
  width: 68px;
  height: 100%;
  padding-top: 10px;
`;

const InviteModalWrapper = styled.div`
  button {
    width: 100%;
    font-size: 14px;
    border-radius: 4px;
    display: block;
    padding: 16px;
    margin-bottom: 8px;
    border: none;
    color: ${(p) => p.theme.colors.N0};
    background-color: var(--N1000);

    &:hover {
      background-color: var(--N1100);
    }
  }
`;

function InviteModal({ space }: { space: Space }) {
  const link = `${env.PUBLIC_FRONTEND_URL}/invite/${space.id}`;

  return (
    <Modal style={{ minWidth: '400px' }}>
      <InviteModalWrapper>
        <h1>Invite Link</h1>
        <button
          type="button"
          onClick={() => {
            // copy to clipboard
            navigator.clipboard.writeText(link);
          }}
        >
          {link}
        </button>
      </InviteModalWrapper>
    </Modal>
  );
}

function ServerIconContextMenu({ space }: { space: Space }) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const setModal = useSetRecoilState(modalState);

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
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <InviteModal space={space} />,
          });
        }}
      >
        Generate Invite
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => await mikoto.client.spaces.leave(space.id)}
      >
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

function SidebarSpaceIcon({ space }: { space: Space }) {
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
        <StyledSpaceIcon
          active={isActive}
          onContextMenu={contextMenu}
          ref={ref}
          icon={space.icon ?? undefined}
          onClick={() => {
            setSpace(space);
          }}
        >
          {space.icon === null ? space.name[0] : ''}
        </StyledSpaceIcon>
      </StyledIconWrapper>
    </Tooltip>
  );
}

function SpaceCreateForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();
  const form = useForm();

  return (
    <Form
      onSubmit={form.handleSubmit(async (data) => {
        await mikoto.client.spaces.create(data.spaceName);
        closeModal();
        form.reset();
      })}
    >
      <Input
        labelName="Space Name"
        placeholder="Awesomerino Space"
        {...form.register('spaceName')}
      />
      <Button variant="primary" type="submit">
        Create Space
      </Button>
    </Form>
  );
}

function CreateSpaceModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const form = useForm();

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        await mikoto.client.spaces.create(data.spaceName);
        setModal(null);
        form.reset();
      })}
    >
      <TextInput
        label="Space Name"
        placeholder="Awesomerino Space"
        {...form.register('spaceName')}
      />
      <Button type="submit">Create Space</Button>
    </form>
  );
}

function SpaceJoinForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();

  const { register, handleSubmit, reset } = useForm({});
  const error = useErrorElement();
  return (
    <Form
      onSubmit={handleSubmit(async (data) => {
        try {
          await mikoto.client.spaces.join(data.spaceId);
          closeModal();
          reset();
        } catch (e) {
          error.setError((e as AxiosError).response?.data as any);
        }
      })}
    >
      {error.el}
      <Input labelName="Space ID" {...register('spaceId')} />
      <Button>Join Space</Button>
    </Form>
  );
}

const SpaceJoinModalWrapper = styled.div`
  min-width: 400px;
  .inviteheader {
    text-align: center;
  }
`;

export function SpaceJoinModal() {
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <SpaceJoinModalWrapper>
        <h1 className="inviteheader" style={{ marginTop: 0 }}>
          Create a Space
        </h1>
        <SpaceCreateForm
          closeModal={() => {
            setModal(null);
          }}
        />
        <h2 className="inviteheader">Have an invite already?</h2>
        <SpaceJoinForm
          closeModal={() => {
            setModal(null);
          }}
        />
      </SpaceJoinModalWrapper>
    </Modal>
  );
}

function ServerSidebarContextMenu() {
  const setModal = useSetRecoilState(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <SpaceJoinModal />,
          });
        }}
      >
        Create / Join Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

export function ServerSidebar() {
  const setModal = useSetRecoilState(modalState);

  const mikoto = useMikoto();
  useDeltaWithRedux<Space>(
    spaceActions,
    mikoto.spaceEmitter,
    '@',
    () => mikoto.client.spaces.list(),
    [],
  );
  const spaces = Object.values(useMikotoSelector((x) => x.spaces));
  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  return (
    <StyledServerSidebar onContextMenu={contextMenu}>
      {spaces.map((space) => (
        <SidebarSpaceIcon space={space} key={space.id} />
      ))}
      <StyledIconWrapper>
        <StyledSpaceIcon
          onClick={() => {
            setModal({
              elem: <SpaceJoinModal />,
            });
          }}
        >
          +
        </StyledSpaceIcon>
      </StyledIconWrapper>
    </StyledServerSidebar>
  );
}
