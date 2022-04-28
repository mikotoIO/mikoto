import { atom, useRecoilState } from 'recoil';
import styled from 'styled-components';
import useEventListener from '@use-it/event-listener';
import { Message } from '../models';
import { Button, Modal, TextInput } from '@mantine/core';
import React, { useEffect, useRef } from 'react';
import { useMikoto } from '../api';
import { useForm } from '@mantine/form';
import constants from '../constants';

type ContextMenuVariant =
  | { kind: 'treebar' }
  | { kind: 'message'; message: Message };

interface ContextMenuData {
  position: {
    top: number;
    left: number;
  };
  variant: ContextMenuVariant;
}

export const contextMenuState = atom<ContextMenuData | null>({
  key: 'contextMenu',
  default: null,
});

const ContextMenuOverlay = styled.div`
  position: fixed;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;

const ContextMenuBase = styled.div`
  color: white;
  pointer-events: all;
  width: 160px;
  padding: 8px;
  font-size: 14px;
  border-radius: 4px;
  background-color: ${(p) => p.theme.colors.N1100};
`;

const ContextMenuLink = styled.a`
  display: block;
  padding: 6px 8px;
  box-sizing: border-box;
  border-radius: 4px;
  width: 100%;
  &:hover {
    background-color: ${(p) => p.theme.colors.N800};
  }
`;

type ModalStates = { kind: 'createChannel' } | null;

const modalState = atom<ModalStates>({
  key: 'modal',
  default: null,
});

function CreateChannelModal() {
  const mikoto = useMikoto();
  const [modal, setModal] = useRecoilState(modalState);
  const form = useForm({
    initialValues: {
      channelName: '',
    },
  });

  return (
    <Modal
      opened={!!(modal && modal.kind === 'createChannel')}
      onClose={() => setModal(null)}
      title="Create Channel"
    >
      <form
        onSubmit={form.onSubmit(async () => {
          await mikoto.createChannel(
            constants.defaultSpace,
            form.values.channelName,
          );
          setModal(null);
          form.reset();
          window.location.reload(); // TODO workaround until we have channel created event
        })}
      >
        <TextInput
          label="Channel Name"
          placeholder="New Channel"
          {...form.getInputProps('channelName')}
        />
        <Button mt={16} fullWidth type="submit">
          Create Channel
        </Button>
      </form>
    </Modal>
  );
}

function TreebarContext() {
  const [, setModal] = useRecoilState(modalState);

  return (
    <ContextMenuBase>
      <ContextMenuLink
        onClick={() => {
          setModal({ kind: 'createChannel' });
        }}
      >
        Create Channel
      </ContextMenuLink>
      <ContextMenuLink>Invite People</ContextMenuLink>
    </ContextMenuBase>
  );
}

function SwitchContextMenu() {
  const [contextMenu, setContextMenu] = useRecoilState(contextMenuState);
  const mikoto = useMikoto();

  if (contextMenu === null) return null; // not going to happen tho
  const { variant } = contextMenu;

  switch (variant.kind) {
    case 'treebar':
      return <TreebarContext />;
    case 'message':
      return (
        <ContextMenuBase>
          <ContextMenuLink
            onClick={async () => {
              setContextMenu(null);
              await mikoto.deleteMessage(
                variant.message.channelId,
                variant.message.id,
              );
            }}
          >
            Delete Message
          </ContextMenuLink>
        </ContextMenuBase>
      );
    default:
      return null;
  }
}

const ContextWrapper = styled.div`
  position: absolute;
  &:focus {
    outline: none;
  }
`;

function useOutsideAlerter(
  ref: React.RefObject<HTMLDivElement>,
  handleClickOutside: (event: MouseEvent) => void,
) {
  useEffect(() => {
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handleClickOutside]);
}

export function ContextMenuKit() {
  const [contextMenu, setContextMenu] = useRecoilState(contextMenuState);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideAlerter(ref, (ev) => {
    if (ref.current && !ref.current.contains(ev.target as any)) {
      setContextMenu(null);
    }
  });

  useEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.code === 'Escape') {
      setContextMenu(null);
    }
  });

  return (
    <ContextMenuOverlay tabIndex={0}>
      <CreateChannelModal />
      {contextMenu && (
        <ContextWrapper ref={ref} style={{ ...contextMenu.position }}>
          <SwitchContextMenu />
        </ContextWrapper>
      )}
    </ContextMenuOverlay>
  );
}
