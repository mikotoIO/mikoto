import { Dialog } from '@headlessui/react';
import styled, { IStyledComponent } from 'styled-components';

type FastOmit<T extends object, U extends string | number | symbol> = {
  [K in keyof T as K extends U ? never : K]: T[K];
};

// absolute center
export const Modal: IStyledComponent<
  'web',
  FastOmit<
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >,
    never
  >
> = styled(Dialog.Panel)`
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
