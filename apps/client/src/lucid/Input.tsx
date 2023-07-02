/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styled from 'styled-components';

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
} & React.InputHTMLAttributes<HTMLInputElement>;

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
