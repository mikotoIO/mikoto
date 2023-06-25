/* eslint-disable jsx-a11y/label-has-associated-control */
import styled from 'styled-components';

export const SInput = styled.input`
  border-color: ${(p) => p.theme.colors.B800};
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

export function Input({
  labelName,
  ...props
}: { labelName?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  if (!labelName) {
    return <SInput {...props} />;
  }
  return (
    <Label>
      <div className="label">{labelName}</div>
      <SInput {...props} />
    </Label>
  );
}
