import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import useEventListener from '@use-it/event-listener';
import { Modal } from '@mantine/core';
import React, { useRef } from 'react';

interface Positions {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

interface ContextMenuData {
  position: Positions;
  elem: React.ReactNode;
}

export const contextMenuState = atom<ContextMenuData | null>({
  key: 'contextComponent',
  default: null,
});

const StyledContextMenuOverlay = styled.div`
  position: fixed;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;

const ContextMenuBase = styled.div`
  color: white;
  width: 160px;
  padding: 8px;
  font-size: 14px;
  border-radius: 4px;
  background-color: ${(p) => p.theme.colors.N1100};
  box-shadow: rgba(0, 0, 0, 0.1) 0 8px 24px;
`;

const StyledContextMenu = styled.div`
  pointer-events: all;
  position: absolute;
  &:focus {
    outline: none;
  }
`;

export function ContextMenuKit() {
  const [context, setContext] = useRecoilState(contextMenuState);

  const ref = useRef<HTMLDivElement>(null);
  useEventListener('mousedown', (ev) => {
    if (ref.current && !ref.current.contains(ev.target as any)) {
      setContext(null);
    }
  });

  useEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.code === 'Escape') {
      setContext(null);
    }
  });

  return (
    <StyledContextMenuOverlay tabIndex={0}>
      {context && (
        <StyledContextMenu ref={ref} style={{ ...context.position }}>
          {context.elem}
        </StyledContextMenu>
      )}
    </StyledContextMenuOverlay>
  );
}

interface ContextMenuFns {
  destroy(): void;
}

function ContextMenuLink({ onClick, ...props }: JSX.IntrinsicElements['a']) {
  const setContextMenu = useSetRecoilState(contextMenuState);

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/no-static-element-interactions
    <a
      {...props}
      onClick={(e) => {
        onClick?.(e);
        setContextMenu(null);
      }}
    />
  );
}

const StyledContextMenuLink = styled(ContextMenuLink)`
  display: block;
  padding: 6px 8px;
  box-sizing: border-box;
  border-radius: 4px;
  width: 100%;

  &:hover {
    background-color: ${(p) => p.theme.colors.N800};
  }
`;

export const ContextMenu = Object.assign(ContextMenuBase, {
  Link: StyledContextMenuLink,
});

export function useContextMenu(
  fn: (fns: ContextMenuFns) => React.ReactNode,
  position?: Positions,
) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  return (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({
      position: position ?? { top: ev.clientY, left: ev.clientX },
      elem: fn({
        destroy() {
          setContextMenu(null);
        },
      }),
    });
  };
}

// modal stuff
interface ModalData {
  title: string;
  elem: React.ReactNode;
}

export const modalState = atom<ModalData | null>({
  key: 'modal',
  default: null,
});

export function ModalKit() {
  const [modal, setModal] = useRecoilState(modalState);

  return (
    <Modal
      opened={modal !== null}
      onClose={() => setModal(null)}
      title={modal?.title}
    >
      {modal?.elem}
    </Modal>
  );
}
