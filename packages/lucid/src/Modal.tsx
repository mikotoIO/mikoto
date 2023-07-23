import { Dialog } from '@headlessui/react';
import styled from 'styled-components';

import { StyledComponent } from './types';

// absolute center
export const Modal: StyledComponent<HTMLDivElement> = styled(Dialog.Panel)`
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
