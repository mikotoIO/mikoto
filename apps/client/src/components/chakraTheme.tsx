import { defineStyleConfig, extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

const Button = defineStyleConfig({
  baseStyle: {
    whiteSpace: 'normal',
    height: 'auto',
    blockSize: 'auto',
    fontWeight: 'regular',
    py: '3',
    px: '6',
  },
  variants: {
    primary: {
      background: 'blue.600',
      color: 'white',
      _hover: {
        background: 'blue.700',
      },
    },
    secondary: {
      background: 'gray.500',
      color: 'white',
      _hover: {
        background: 'gray.600',
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

const Textarea = defineStyleConfig({
  variants: {
    outline: {
      background: 'gray.800',
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
    gray: {
      900: 'hsl(230, 12%, 11%)',
      850: 'hsl(230, 12%, 12.5%)',
      800: 'hsl(230, 12%, 14%)',
      750: 'hsl(230, 12%, 17%)',
      700: 'hsl(230, 16%, 20%)',
      650: 'hsl(230, 16%, 27%)',
      600: 'hsl(230, 16%, 35%)',
      550: 'hsl(230, 16%, 42%)',
      500: 'hsl(230, 16%, 52%)',
      450: 'hsl(230, 16%, 60%)',
      400: 'hsl(230, 16%, 69%)',
      350: 'hsl(230, 16%, 75%)',
      300: 'hsl(230, 20%, 84%)',
      250: 'hsl(230, 20%, 88%)',
      200: 'hsl(230, 20%, 91%)',
      150: 'hsl(230, 20%, 93%)',
      100: 'hsl(230, 20%, 95%)',
      50: 'hsl(230, 25%, 98%)',
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
    yellow: {
      900: 'hsl(33, 100%, 21%)',
      800: 'hsl(33, 100%, 35%)',
      700: 'hsl(33, 100%, 45%)',
      600: 'hsl(33, 100%, 55%)',
      500: 'hsl(33, 100%, 65%)',
      400: 'hsl(33, 100%, 75%)',
      300: 'hsl(33, 100%, 80%)',
      200: 'hsl(33, 100%, 85%)',
      100: 'hsl(33, 100%, 90%)',
      50: 'hsl(33, 100%, 95%)',
    },
    red: {
      900: 'hsl(350, 90%, 11%)',
      800: 'hsl(350, 90%, 20%)',
      700: 'hsl(350, 90%, 33%)',
      600: 'hsl(350, 90%, 44%)',
      500: 'hsl(350, 90%, 55%)',
      400: 'hsl(350, 90%, 70%)',
      300: 'hsl(350, 90%, 75%)',
      200: 'hsl(350, 90%, 80%)',
      100: 'hsl(350, 90%, 85%)',
      50: 'hsl(350, 90%, 90%)',
    },
  },
  semanticTokens: {
    colors: {
      primary: 'blue.500',
      text: 'gray.50',
      surface: 'gray.700',
      subsurface: 'gray.750',
    },
  },
  components: {
    Button,
    FormLabel,
    Input,
    Textarea,
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
    code: '"JetBrains Mono", monospace',
  },
});

export const globalCss = css`
  :root {
    --font-main: 'Open Sans', sans-serif;
    --font-code: 'JetBrains Mono', monospace;
  }

  background-color: var(--chakra-colors-subsurface);
  color: var(--chakra-colors-text);

  h1:first-of-type,
  h2:first-of-type,
  h3:first-of-type,
  h4:first-of-type,
  h5:first-of-type,
  h6:first-of-type {
    margin-top: 0;
  }

  button,
  a {
    cursor: pointer;
  }

  * {
    box-sizing: border-box;
  }

  button {
    border: none;
  }

  body {
    overscroll-behavior-x: none;
    overscroll-behavior-y: none;
    height: 100%;
    min-height: 100%;
    margin: 0;
    font-family: var(--chakra-fonts-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  code {
    font-family: var(--chakra-fonts-code);
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: hsl(220, 7%, 17%);
    border-radius: 4px;
  }
`;
