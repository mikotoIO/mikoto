import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';
import 'react';

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Radio = function Radio(props: RadioProps) {
  const { children, inputProps, ...rest } = props;
  return (
    <ChakraRadioGroup.Item {...rest}>
      <ChakraRadioGroup.ItemHiddenInput {...inputProps} />
      <ChakraRadioGroup.ItemIndicator />
      {children && (
        <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
      )}
    </ChakraRadioGroup.Item>
  );
};

export const RadioGroup = ChakraRadioGroup.Root;
