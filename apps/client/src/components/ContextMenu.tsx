import {atom, useRecoilState} from "recoil";
import styled from "styled-components";
import useEventListener from "@use-it/event-listener";
import {Message} from "../api";
import {Button, Group, Input, Modal, TextInput} from '@mantine/core';
import {useState} from "react";

type ContextMenuVariant =
    { kind: 'treebar' }
  | { kind: 'message', message: Message };

interface ContextMenuData {
  position: {
    top: number;
    left: number;
  }
  variant: ContextMenuVariant
}

export const contextMenuState = atom<ContextMenuData|null>({
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
  background-color: ${p => p.theme.colors.N1100};
  position: absolute;
`;

interface SwitchContextMenuProps {
  variant: ContextMenuVariant;
  point: { top: number, left: number };
}

const ContextMenuLink = styled.a`
  display: block;
  padding: 6px 8px;
  box-sizing: border-box;
  border-radius: 4px;
  width: 100%;
  &:hover {
    background-color: ${p => p.theme.colors.N800}
  }
`;

function TreebarContext() {
  const [contextMenu, setContextMenu] = useRecoilState(contextMenuState);
  const [modal, setModal] = useState('');

  return (
    <ContextMenuBase style={{...contextMenu!.position}}>
      <Modal
        opened={modal === 'createChannel'}
        onClose={() => setModal('')}
        title="Create Channel"
      >
        <TextInput label="Channel Name" placeholder="#awesome-channel"/>
        <Group mt={8}><Button>Create Channel</Button></Group>
      </Modal>
      <ContextMenuLink onClick={() => {
        setModal('createChannel');
      }}>Create Channel</ContextMenuLink>
      <ContextMenuLink>Invite People</ContextMenuLink>
    </ContextMenuBase>
  )
}

function SwitchContextMenu({ variant, point }: SwitchContextMenuProps) {
  const [, setContextMenu] = useRecoilState(contextMenuState);

  switch (variant.kind) {
    case "treebar":
      return <TreebarContext/>
    case "message":
      return (
        <ContextMenuBase style={{...point}}>
          <ContextMenuLink onClick={() => {
            setContextMenu(null);
          }}>Delete Message</ContextMenuLink>
        </ContextMenuBase>
      )
    default:
      return null;
  }
}

export function ContextMenuKit() {
  const [contextMenu, setContextMenu] = useRecoilState(contextMenuState);

  useEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.code === 'Escape') {
      setContextMenu(null);
    }
  })

  return (
    <ContextMenuOverlay tabIndex={0}>
      {contextMenu && <SwitchContextMenu variant={contextMenu.variant} point={contextMenu.position}/>}
    </ContextMenuOverlay>
  )
}
