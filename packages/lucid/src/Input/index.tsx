/* eslint-disable react/prop-types */

/* eslint-disable jsx-a11y/label-has-associated-control */
import { Switch } from '@headlessui/react';
import React from 'react';
import styled, { css } from 'styled-components';

import { BoxProps, boxCss } from '../Layout';

const baseInputCss = css`
  height: 44px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
  padding: 4px 16px;
  color: var(--N200);
  background-color: var(--N1100);
  outline: none;
  resize: none;
  font-family: var(--font-main);
`;

export const BaseInput = styled.input<BoxProps>`
  ${baseInputCss}
  ${boxCss}
`;

export const BaseTextArea = styled.textarea<BoxProps>`
  ${baseInputCss}
  ${boxCss}
  padding: 16px 16px;
`;

const Label = styled.label`
  display: block;
  color: var(--N200);
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
      return <BaseInput {...props} />;
    }
    return (
      <Label>
        <div className="label">{labelName}</div>
        <BaseInput {...props} ref={ref} />
      </Label>
    );
  },
);

type TextAreaProps = {
  labelName?: string;
} & BoxProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ labelName, ...props }, ref) => {
    if (!labelName) {
      return <BaseTextArea {...props} />;
    }
    return (
      <Label>
        <div className="label">{labelName}</div>
        <BaseTextArea {...props} ref={ref} />
      </Label>
    );
  },
);

export type ComboData = (string | { name: string; value: string })[];

type SelectInputProps = {
  labelName?: string;
  data: ComboData;
} & BoxProps &
  React.InputHTMLAttributes<HTMLSelectElement>;

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  SelectInputProps
>(({ labelName, ...props }, ref) => {
  if (!labelName) {
    return (
      <BaseInput {...props} as="select">
        {props.data.map((item) => {
          if (typeof item === 'string') {
            return (
              <option key={item} value={item}>
                {item}
              </option>
            );
          }
          return (
            <option key={item.value} value={item.value}>
              {item.name}
            </option>
          );
        })}
      </BaseInput>
    );
  }
  return (
    <Label>
      <div className="label">{labelName}</div>
      <SelectInput {...props} ref={ref} />
    </Label>
  );
});
// toggle

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

const BaseCheckbox = styled.input<BoxProps>`
  width: 16px;
  height: 16px;
  &:checked {
    background-color: var(--B700);
  }

  ${boxCss}
`;

const CheckboxLabel = styled.label`
  color: var(--N200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  .label {
    margin-bottom: 8px;
  }
`;

export const Checkbox = React.forwardRef<HTMLInputElement, InputProps>(
  ({ labelName, ...props }, ref) => {
    if (!labelName) {
      return <BaseCheckbox type="checkbox" {...props} />;
    }
    return (
      <CheckboxLabel>
        <div className="label">{labelName}</div>
        <BaseCheckbox type="checkbox" {...props} ref={ref} />
      </CheckboxLabel>
    );
  },
);
