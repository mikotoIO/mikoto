import { Tooltip } from '@mantine/core';
import { Button, Form, Input, Modal, Image } from '@mikoto-io/lucid';
import { AxiosError } from 'axios';
import { ClientSpace, Invite, Space, SpaceStore } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import { useHover } from 'usehooks-ts';

import { env } from '../env';
import { useMikoto } from '../hooks';
import { useErrorElement } from '../hooks/useErrorElement';
import { treebarSpaceState, useTabkit } from '../store';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { Pill } from './atoms/Pill';
import { StyledSpaceIcon } from './atoms/SpaceIcon';

const StyledServerSidebar = styled.div`
  background-color: var(--N1000);
  align-items: center;
  box-sizing: border-box;
  width: 68px;

  flex-grow: 1;
  overflow: scroll;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

const InviteModalWrapper = styled.div`
  .invite-link {
    width: 100%;
    font-size: 14px;
    border-radius: 4px;
    display: block;
    padding: 16px;
    margin-bottom: 8px;
    border: none;
    color: var(--N0);
    background-color: var(--N1000);
    font-family: var(--font-mono);

    &:hover {
      background-color: var(--N1100);
    }
  }
`;

function InviteModal({ space }: { space: Space }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const mikoto = useMikoto();
  const link = invite
    ? `${env.PUBLIC_FRONTEND_URL}/invite/${invite.code}`
    : undefined;

  return (
    <Modal style={{ minWidth: '400px' }}>
      <InviteModalWrapper>
        {!invite ? (
          <Button
            type="button"
            onClick={() => {
              mikoto.client.spaces.createInvite(space.id).then((x) => {
                setInvite(x);
              });
            }}
          >
            Generate
          </Button>
        ) : (
          <>
            <h1>Invite Link</h1>
            <button
              className="invite-link"
              type="button"
              onClick={() => {
                // copy to clipboard
                navigator.clipboard.writeText(link ?? '');
              }}
            >
              {link}
            </button>
          </>
        )}
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
              spaceId: space.id,
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
        onClick={async () => {
          await mikoto.client.spaces.leave(space.id);
        }}
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

function SidebarSpaceIcon({ space }: { space: ClientSpace }) {
  const [stateSpace, setSpace] = useRecoilState(treebarSpaceState);
  const isActive = stateSpace === space.id;

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
            setSpace(space.id);
            space.fetchMembers().then();
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

export const ServerSidebar = observer(({ spaces }: { spaces: SpaceStore }) => {
  const setModal = useSetRecoilState(modalState);
  const [stateSpace, setSpace] = useRecoilState(treebarSpaceState);

  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  return (
    <StyledServerSidebar onContextMenu={contextMenu}>
      <StyledIconWrapper>
        <Pill h={stateSpace === null ? 32 : 8} />
        <StyledSpaceIcon
          style={{
            backgroundColor: stateSpace === null ? 'var(--B700)' : undefined,
            marginTop: '8px',
            marginBottom: '8px',
          }}
          active
          onClick={() => {
            setSpace(null);
          }}
        >
          <Image src="/logo/logo.svg" w={20} />
        </StyledSpaceIcon>
      </StyledIconWrapper>
      {Array.from(spaces.values()).map((space) => (
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
});
