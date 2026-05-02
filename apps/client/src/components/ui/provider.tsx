import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

import { chakraSystem } from '../chakraTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={chakraSystem}>
      <NextThemeProvider
        attribute="class"
        disableTransitionOnChange
        forcedTheme="dark"
      >
        {children}
      </NextThemeProvider>
    </ChakraProvider>
  );
}
