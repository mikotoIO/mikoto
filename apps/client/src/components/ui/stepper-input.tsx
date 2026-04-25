import { HStack, IconButton, NumberInput } from '@chakra-ui/react';
import 'react';
import { LuMinus, LuPlus } from 'react-icons/lu';

export interface StepperInputProps extends NumberInput.RootProps {
  label?: React.ReactNode;
}

export const StepperInput = function StepperInput(props: StepperInputProps, ref) {
  const { label, ...rest } = props;
  return (
    <NumberInput.Root {...rest} unstyled ref={ref}>
      {label && <NumberInput.Label>{label}</NumberInput.Label>}
      <HStack gap="2">
        <DecrementTrigger />
        <NumberInput.ValueText textAlign="center" fontSize="lg" minW="3ch" />
        <IncrementTrigger />
      </HStack>
    </NumberInput.Root>
  );
};

const DecrementTrigger = function DecrementTrigger(props: NumberInput.DecrementTriggerProps, ref) {
  return (
    <NumberInput.DecrementTrigger {...props} asChild ref={ref}>
      <IconButton variant="outline" size="sm">
        <LuMinus />
      </IconButton>
    </NumberInput.DecrementTrigger>
  );
};

const IncrementTrigger = function IncrementTrigger(props: NumberInput.IncrementTriggerProps, ref) {
  return (
    <NumberInput.IncrementTrigger {...props} asChild ref={ref}>
      <IconButton variant="outline" size="sm">
        <LuPlus />
      </IconButton>
    </NumberInput.IncrementTrigger>
  );
};
