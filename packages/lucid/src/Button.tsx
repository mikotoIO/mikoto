import styled from 'styled-components';

import { BoxProps, boxCss } from './Layout';

export const Buttons = styled.div`
  display: flex;
  gap: 8px;
`;

const variantMap = {
  default: {
    backgroundColor: 'var(--N500)',
    color: 'var(--N0)',
  },
  primary: {
    backgroundColor: 'var(--B700)',
    color: 'var(--N0)',
  },
  secondary: {
    backgroundColor: 'var(--V700)',
    color: 'var(--N0)',
  },
  success: {
    backgroundColor: 'var(--G700)',
    color: 'var(--N0)',
  },
  warning: {
    backgroundColor: 'var(--Y700)',
    color: 'var(--N0)',
  },
  danger: {
    backgroundColor: 'var(--R700)',
    color: 'var(--N0)',
  },
};

export type ButtonProps = Partial<{
  variant: keyof typeof variantMap;
}>;

export const Button = styled.button<ButtonProps & BoxProps>`
  ${boxCss}
  background-color: ${(p) => variantMap[p.variant!].backgroundColor};

  color: ${(p) => variantMap[p.variant!].color};
  font-weight: bolder;
  border: none;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
  }
  transition: box-shadow 0.1s ease-in-out;
  cursor: pointer;
`;

Button.defaultProps = {
  as: 'button',
  variant: 'default',
  p: {
    x: 20,
    y: 12,
  },
  fs: 14,
  rounded: 4,
};
