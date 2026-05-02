import { PinInput as ChakraPinInput, Group } from '@chakra-ui/react';
import 'react';

export interface PinInputProps extends ChakraPinInput.RootProps {
  count?: number;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  attached?: boolean;
}

export const PinInput = function PinInput(props: PinInputProps) {
  const { count = 4, inputProps, attached, ...rest } = props;
  return (
    <ChakraPinInput.Root {...rest}>
      <ChakraPinInput.HiddenInput {...inputProps} />
      <ChakraPinInput.Control>
        <Group attached={attached}>
          {Array.from({ length: count }).map((_, index) => (
            <ChakraPinInput.Input key={index} index={index} />
          ))}
        </Group>
      </ChakraPinInput.Control>
    </ChakraPinInput.Root>
  );
};
