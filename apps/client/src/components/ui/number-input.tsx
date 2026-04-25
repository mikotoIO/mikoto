import { NumberInput as ChakraNumberInput } from '@chakra-ui/react';
import 'react';

export type NumberInputProps = ChakraNumberInput.RootProps;

export const NumberInputRoot = function NumberInput(props: NumberInputProps, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraNumberInput.Root ref={ref} variant="outline" {...rest}>
      {children}
      <ChakraNumberInput.Control>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
    </ChakraNumberInput.Root>
  );
};

export const NumberInputField = ChakraNumberInput.Input;
export const NumberInputScruber = ChakraNumberInput.Scrubber;
export const NumberInputLabel = ChakraNumberInput.Label;
