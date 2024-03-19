import { defineStyleConfig, extendTheme } from '@chakra-ui/react';

const FormLabel = defineStyleConfig({
  baseStyle: {
    fontWeight: 'bold',
  },
});

const Input = defineStyleConfig({
  variants: {
    outline: {
      field: {
        background: 'gray.800',
      },
    },
  },
});

export const chakraTheme = extendTheme({
  components: {
    FormLabel,
    Input,
  },
  styles: {
    global: {
      body: {
        fontFamily: null,
        lineHeight: null,
      },
    },
  },
  fonts: {
    heading: '"Open Sans", sans-serif',
    body: '"Open Sans", sans-serif',
  },
});
