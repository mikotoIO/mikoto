/* eslint-disable jsx-a11y/label-has-associated-control */
import { Switch } from '@headlessui/react';
import React from 'react';
import styled from 'styled-components';

import { BoxProps, boxCss } from './Layout';

export const SInput = styled.input`
  height: 44px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
  padding: 4px 16px;
  color: ${(p) => p.theme.colors.N200};
  background-color: ${(p) => p.theme.colors.N1100};
  outline: none;
  ${boxCss}
`;

const Label = styled.label`
  display: block;
  color: ${(p) => p.theme.colors.N200};
  .label {
    font-weight: bold;
    margin-bottom: 8px;
  }
`;

type InputProps = {
  labelName?: string;
} & BoxProps &
  React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ labelName, ...props }, ref) => {
    if (!labelName) {
      return <SInput {...props} />;
    }
    return (
      <Label>
        <div className="label">{labelName}</div>
        <SInput {...props} ref={ref} />
      </Label>
    );
  },
);

type ToggleProps = Partial<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}>;

const StyledToggle = styled(Switch)`
  outline: none;
  border: none;
  border-radius: 40px;
  width: 60px;
  height: 30px;
  display: flex;
  background-color: var(--N1000);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: 0.2s;

  &[data-headlessui-state='checked'] {
    background-color: var(--B700);
  }
`;

const ToggleInner = styled.div<{ checked: boolean }>`
  display: flex;
  transition: 0.2s;
  transform: ${(p) => (p.checked ? 'translateX(60%)' : 'translateX(-60%)')};
  height: 75%;
  aspect-ratio: 1 / 1;
  border-radius: 40px;
  background-color: var(--N0);
`;

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <StyledToggle checked={checked} onChange={onChange}>
      {(c) => <ToggleInner checked={c.checked} />}
    </StyledToggle>
  );
}
