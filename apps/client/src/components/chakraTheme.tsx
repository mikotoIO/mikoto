import { defineStyleConfig, extendTheme } from '@chakra-ui/react';

const Button = defineStyleConfig({
  variants: {
    primary: {
      background: 'blue.600',
      color: 'white',
      _hover: {
        background: 'blue.700',
      },
    },
    success: {
      background: 'green.600',
      color: 'white',
      _hover: {
        background: 'green.700',
      },
    },
    warning: {
      background: 'yellow.600',
      color: 'white',
      _hover: {
        background: 'yellow.700',
      },
    },
    danger: {
      background: 'red.600',
      color: 'white',
      _hover: {
        background: 'red.700',
      },
    },
  },
});

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

const Link = defineStyleConfig({
  baseStyle: {
    color: 'blue.200',
  },
});

export const chakraTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    // gray: {
    //   50: "hsl(204, 45%, 98%)",
    //   100: "hsl(210, 38%, 95%)",
    //   200: "hsl(214, 32%, 91%)",
    //   300: "hsl(211, 25%, 84%)",
    //   400: "hsl(214, 20%, 69%)",
    //   500: "hsl(216, 15%, 52%)",
    //   600: "hsl(218, 17%, 35%)",
    //   700: "hsl(218, 23%, 23%)",
    //   800: "hsl(220, 26%, 14%)",
    //   900: "hsl(230, 21%, 11%)",
    // },
    gray: {
      50: 'hsl(230, 25%, 98%)',
      100: 'hsl(230, 10%, 95%)',
      200: 'hsl(230, 10%, 91%)',
      300: 'hsl(230, 10%, 84%)',
      400: 'hsl(230, 10%, 69%)',
      500: 'hsl(230, 10%, 52%)',
      600: 'hsl(230, 10%, 35%)',
      700: 'hsl(230, 12%, 20%)',
      800: 'hsl(230, 13%, 14%)',
      900: 'hsl(230, 13%, 11%)',
    },
    blue: {
      900: 'hsl(214, 100%, 11%)',
      800: 'hsl(214, 100%, 20%)',
      700: 'hsl(214, 100%, 37%)',
      600: 'hsl(214, 100%, 50%)',
      500: 'hsl(214, 96%, 60%)',
      400: 'hsl(214, 92%, 70%)',
      300: 'hsl(214, 90%, 75%)',
      200: 'hsl(214, 88%, 80%)',
      100: 'hsl(214, 86%, 85%)',
      50: 'hsl(214, 84%, 90%)',
    },
  },
  components: {
    Button,
    FormLabel,
    Input,
    Link,
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
