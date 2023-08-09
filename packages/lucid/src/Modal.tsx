import { Dialog } from '@headlessui/react';
import { ComponentProps } from 'react';
import styled from 'styled-components';

import { StyledComponent } from './types';

// absolute center
export const ModalBase: StyledComponent<HTMLDivElement> = styled(Dialog.Panel)`
  background-color: var(--N800);
  color: var(--N0);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
`;

export function Modal({
  noBackdrop,
  ...props
}: ComponentProps<typeof ModalBase> & {
  noBackdrop?: boolean;
}) {
  return (
    <>
      {!noBackdrop && <ModalBackdrop />}
      <ModalBase {...props} />
    </>
  );
}

export const ModalBackdrop = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;

export interface ModalViewProps {
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function ModalView({ children, open, onClose }: ModalViewProps) {
  return (
    <Dialog open={open} onClose={() => onClose?.()}>
      {children}
    </Dialog>
  );
}
