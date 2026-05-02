import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';
import 'react';

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Checkbox = function Checkbox(props: CheckboxProps) {
  const { icon, children, inputProps, ...rest } = props;
  return (
    <ChakraCheckbox.Root {...rest}>
      <ChakraCheckbox.HiddenInput {...inputProps} />
      <ChakraCheckbox.Control>
        {icon || <ChakraCheckbox.Indicator />}
      </ChakraCheckbox.Control>
      {children != null && (
        <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>
      )}
    </ChakraCheckbox.Root>
  );
};
