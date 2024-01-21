import { ModalView } from '@mikoto-io/lucid';
import useEventListener from '@use-it/event-listener';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

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
  width: 100%;
  height: 100%;
`;

const ContextMenuBase = styled.div`
  color: var(--N0);
  width: 160px;
  padding: 8px;
  font-size: 14px;
  border-radius: 4px;
  background-color: var(--N1100);
  box-shadow: rgba(0, 0, 0, 0.1) 0 8px 24px;
`;

interface StyledContextMenuProps {
  bottomPin?: boolean;
}

// TODO: probably a smarter way to do this
const StyledContextMenu = styled.div<StyledContextMenuProps>`
  pointer-events: all;
  position: absolute;
  &:focus {
    outline: none;
  }
  ${(p) => p.bottomPin && `bottom: 0 !important; top: unset !important;`}
`;

export function ContextMenuKit() {
  const [context, setContext] = useRecoilState(contextMenuState);
  const [bottomPin, setBottomPin] = useState<boolean>(false);

  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setBottomPin(rect.top + rect.height > window.innerHeight);
      // console.log(rect);
      // console.log(rect.top + rect.height > window.innerHeight);
    } else {
      setBottomPin(false);
    }
  }, [context ? 'something' : '']);

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
        <StyledContextMenu
          ref={ref}
          style={{ ...context.position }}
          bottomPin={bottomPin}
        >
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
    background-color: var(--N800);
  }
`;

export const ContextMenu = Object.assign(ContextMenuBase, {
  Link: StyledContextMenuLink,
});

export function useContextMenuX(position?: Positions) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  return (Elem: React.ReactNode | React.FC) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({
      position: position ?? { top: ev.clientY, left: ev.clientX },
      elem: Elem instanceof Function ? <Elem /> : Elem,
    });
  };
}

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
  elem: React.ReactNode;
}

export const modalState = atom<ModalData | null>({
  key: 'modal',
  default: null,
});

export function ModalKit() {
  const [modal, setModal] = useRecoilState(modalState);

  // opened={modal !== null}
  return (
    <ModalView
      open={modal !== null}
      onClose={() => {
        setModal(null);
      }}
    >
      {modal?.elem}
    </ModalView>
  );
}
