import type { ButtonProps as ChakraCloseButtonProps } from '@chakra-ui/react';
import { IconButton as ChakraIconButton } from '@chakra-ui/react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'react';

export type CloseButtonProps = ChakraCloseButtonProps;

export const CloseButton = function CloseButton(props: CloseButtonProps) {
  return (
    <ChakraIconButton variant="ghost" aria-label="Close" {...props}>
      {props.children ?? <FontAwesomeIcon icon={faXmark} />}
    </ChakraIconButton>
  );
};
