import { Dialog } from '@headlessui/react';
import type {} from '@headlessui/react';
import styled, { StyledComponent } from 'styled-components';

export type StyledModalType = StyledComponent<
  typeof Dialog.Panel,
  any,
  {},
  never
>;

// absolute center
export const Modal: StyledModalType = styled(Dialog.Panel)`
  background-color: ${(p) => p.theme.colors.N800};
  color: ${(p) => p.theme.colors.N0};
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
`;

export const ModalBackdrop = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;
