/* eslint-disable react/prop-types */
import React from 'react';
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

const StyledButton = styled.button<
  Partial<{
    variant: keyof typeof variantMap;
    transparent: boolean;
    loading: boolean;
  }> &
    BoxProps
>`
  background-color: ${(p) =>
    p.transparent ? 'transparent' : variantMap[p.variant!].backgroundColor};

  color: ${(p) =>
    p.transparent
      ? variantMap[p.variant!].backgroundColor
      : variantMap[p.variant!].color};
  font-weight: bolder;
  border: none;
  text-decoration: none;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(0, 0, 0, 0.1);
  }

  transition: box-shadow 0.1s ease-in-out;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;
  gap: 0.6em;

  ${boxCss}
`;

StyledButton.defaultProps = {
  as: 'button',
  variant: 'default',
  p: {
    x: 16,
    y: 12,
  },
  fs: 14,
  rounded: 4,
};

export function Button({
  children,
  ...props
}: React.ComponentProps<typeof StyledButton>) {
  return (
    <StyledButton {...props}>{props.loading ? null : children}</StyledButton>
  );
}
