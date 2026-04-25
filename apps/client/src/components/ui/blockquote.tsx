import { Blockquote as ChakraBlockquote } from '@chakra-ui/react';
import 'react';

export interface BlockquoteProps extends ChakraBlockquote.RootProps {
  cite?: React.ReactNode;
  citeUrl?: string;
  icon?: React.ReactNode;
  showDash?: boolean;
}

export const Blockquote = function Blockquote(props: BlockquoteProps, ref) {
  const { children, cite, citeUrl, showDash, icon, ...rest } = props;

  return (
    <ChakraBlockquote.Root ref={ref} {...rest}>
      {icon}
      <ChakraBlockquote.Content cite={citeUrl}>
        {children}
      </ChakraBlockquote.Content>
      {cite && (
        <ChakraBlockquote.Caption>
          {showDash ? <>&mdash;</> : null} <cite>{cite}</cite>
        </ChakraBlockquote.Caption>
      )}
    </ChakraBlockquote.Root>
  );
};

export const BlockquoteIcon = ChakraBlockquote.Icon;
