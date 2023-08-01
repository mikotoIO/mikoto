/* eslint-disable react/prop-types */

/* eslint-disable jsx-a11y/label-has-associated-control */
import { Switch, Listbox } from '@headlessui/react';
import React from 'react';
import styled, { css } from 'styled-components';

import { BoxProps, boxCss } from './Layout';

const baseInputCss = css`
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
  resize: none;
  font-family: var(--font-main);
`;

export const SInput = styled.input`
  ${baseInputCss}
  ${boxCss}
`;

export const STextArea = styled.textarea`
  ${baseInputCss}
  ${boxCss}
  padding: 16px 16px;
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
  textarea?: boolean;
} & BoxProps &
  React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ textarea, labelName, ...props }, ref) => {
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

type TextAreaProps = {
  labelName?: string;
  textarea?: boolean;
} & BoxProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ textarea, labelName, ...props }, ref) => {
    if (!labelName) {
      return <STextArea {...props} />;
    }
    return (
      <Label>
        <div className="label">{labelName}</div>
        <STextArea {...props} ref={ref} />
      </Label>
    );
  },
);

type SelectProps = {
  labelName?: string;
  children?: React.ReactNode;
};

const BaseSelectInput = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ labelName, children }, ref) => {
    if (!labelName) {
      return <Listbox />;
    }
    return (
      <Label>
        <div className="label">{labelName}</div>
        <Listbox ref={ref}>{children}</Listbox>
      </Label>
    );
  },
);

const StyledSelectInputButton = styled(Listbox.Button)`
  ${baseInputCss}
  ${boxCss}
`;

export function SelectInputButton(
  props: React.HTMLAttributes<HTMLButtonElement>,
) {
  return <StyledSelectInputButton {...props} />;
}

export function SelectInputOptions(
  props: React.HTMLAttributes<HTMLUListElement>,
) {
  return <Listbox.Options {...props} />;
}

export function SelectInputOption(
  props: React.LiHTMLAttributes<HTMLLIElement> & {
    disabled?: boolean | undefined;
    value: string;
  },
) {
  return <Listbox.Option {...props} />;
}

export const SelectInput = Object.assign(BaseSelectInput, {
  Button: SelectInputButton,
  Options: SelectInputOptions,
  Option: SelectInputOption,
});

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
