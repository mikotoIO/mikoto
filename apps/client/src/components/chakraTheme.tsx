import {
  createSystem,
  defaultConfig,
  defineConfig,
  mergeConfigs,
} from '@chakra-ui/react';
import { css } from '@emotion/react';

export const chakraTheme = defineConfig({
  // config: {
  //   initialColorMode: 'dark',
  //   useSystemColorMode: false,
  // },
  preflight: false,
  globalCss: {
    '*::selection': {
      bg: 'blue.700',
    },
  },
  theme: {
    tokens: {
      colors: {
        gray: {
          900: { value: 'hsl(230, 12%, 11%)' },
          850: { value: 'hsl(230, 12%, 12.5%)' },
          800: { value: 'hsl(230, 12%, 14%)' },
          750: { value: 'hsl(230, 12%, 17%)' },
          700: { value: 'hsl(230, 16%, 20%)' },
          650: { value: 'hsl(230, 16%, 27%)' },
          600: { value: 'hsl(230, 16%, 35%)' },
          550: { value: 'hsl(230, 16%, 42%)' },
          500: { value: 'hsl(230, 16%, 52%)' },
          450: { value: 'hsl(230, 16%, 60%)' },
          400: { value: 'hsl(230, 16%, 69%)' },
          350: { value: 'hsl(230, 16%, 75%)' },
          300: { value: 'hsl(230, 20%, 84%)' },
          250: { value: 'hsl(230, 20%, 88%)' },
          200: { value: 'hsl(230, 20%, 91%)' },
          150: { value: 'hsl(230, 20%, 93%)' },
          100: { value: 'hsl(230, 20%, 95%)' },
          50: { value: 'hsl(230, 25%, 98%)' },
        },
        blue: {
          900: { value: 'hsl(214, 100%, 11%)' },
          800: { value: 'hsl(214, 100%, 20%)' },
          700: { value: 'hsl(214, 100%, 37%)' },
          600: { value: 'hsl(214, 100%, 50%)' },
          500: { value: 'hsl(214, 96%, 60%)' },
          400: { value: 'hsl(214, 92%, 70%)' },
          300: { value: 'hsl(214, 90%, 75%)' },
          200: { value: 'hsl(214, 88%, 80%)' },
          100: { value: 'hsl(214, 86%, 85%)' },
          50: { value: 'hsl(214, 84%, 90%)' },
        },
        yellow: {
          900: { value: 'hsl(33, 100%, 21%)' },
          800: { value: 'hsl(33, 100%, 35%)' },
          700: { value: 'hsl(33, 100%, 45%)' },
          600: { value: 'hsl(33, 100%, 55%)' },
          500: { value: 'hsl(33, 100%, 65%)' },
          400: { value: 'hsl(33, 100%, 75%)' },
          300: { value: 'hsl(33, 100%, 80%)' },
          200: { value: 'hsl(33, 100%, 85%)' },
          100: { value: 'hsl(33, 100%, 90%)' },
          50: { value: 'hsl(33, 100%, 95%)' },
        },
        red: {
          900: { value: 'hsl(350, 90%, 11%)' },
          800: { value: 'hsl(350, 90%, 20%)' },
          700: { value: 'hsl(350, 90%, 33%)' },
          600: { value: 'hsl(350, 90%, 44%)' },
          500: { value: 'hsl(350, 90%, 55%)' },
          400: { value: 'hsl(350, 90%, 70%)' },
          300: { value: 'hsl(350, 90%, 75%)' },
          200: { value: 'hsl(350, 90%, 80%)' },
          100: { value: 'hsl(350, 90%, 85%)' },
          50: { value: 'hsl(350, 90%, 90%)' },
        },
      },
      fonts: {
        heading: { value: '"Inter", sans-serif' },
        body: { value: '"Inter", sans-serif' },
        code: { value: '"JetBrains Mono", monospace' },
      },
    },
    semanticTokens: {
      colors: {
        primary: { value: '{colors.blue.500}' },
        text: { value: '{colors.gray.50}' },
        surface: { value: '{colors.gray.700}' },
        subsurface: { value: '{colors.gray.750}' },
      },
    },
  },
});

export const globalCss = css`
  :root {
    --font-main: 'Inter', sans-serif;
    --font-code: 'JetBrains Mono', monospace;
  }

  input {
    border-style: solid;
    background-color: var(--chakra-colors-subsurface);
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

  /* Custom DockView styling to match Mikoto's theme */
  .dockview-theme-light {
    --dv-background-color: var(--chakra-colors-surface);
    --dv-tab-active-background-color: var(--chakra-colors-surface);
    --dv-tab-active-foreground-color: var(--chakra-colors-gray-200);
    --dv-tab-inactive-background-color: var(--chakra-colors-subsurface);
    --dv-tab-inactive-foreground-color: var(--chakra-colors-gray-300);
    --dv-tab-border-bottom-color: var(--chakra-colors-primary);
    --dv-separator-border: 1px solid var(--chakra-colors-gray-700);
    --dv-dragged-object-border: 1px solid var(--chakra-colors-primary);
    --dv-palette-background-color: var(--chakra-colors-subsurface);
    --dv-palette-foreground-color: var(--chakra-colors-gray-200);
  }

  /* Fix the tab sizing */
  .dockview-react-part-tabs {
    height: 36px;
  }

  /* Make sure panels take full height */
  .panel-content {
    height: 100%;
    overflow: hidden;
  }

  /* Add border for active tabs */
  .tab.active {
    border-bottom: 2px solid var(--chakra-colors-primary);
  }

  /* Handle empty state */
  .empty-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: var(--chakra-colors-surface);
    color: var(--chakra-colors-gray-300);
  }
`;

export const chakraSystem = createSystem(
  mergeConfigs(defaultConfig, chakraTheme),
);
