'use client';

import { ChakraProvider } from '@chakra-ui/react';

import { chakraSystem } from '../chakraTheme';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={chakraSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
