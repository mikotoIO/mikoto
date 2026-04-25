import type { ButtonProps as ChakraCloseButtonProps } from '@chakra-ui/react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import 'react';
import { LuX } from 'react-icons/lu';

export type CloseButtonProps = ChakraCloseButtonProps;

export const CloseButton = function CloseButton(props: CloseButtonProps) {
  return (
    <ChakraIconButton variant="ghost" aria-label="Close" {...props}>
      {props.children ?? <LuX />}
    </ChakraIconButton>
  );
};
