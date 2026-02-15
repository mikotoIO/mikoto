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
        heading: { value: '"Outfit", sans-serif' },
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
    --font-heading: 'Outfit', sans-serif;
    --font-main: 'Inter', sans-serif;
    --font-code: 'JetBrains Mono', monospace;
  }

  /* Dockview Mikoto theme - uses Chakra color tokens */
  .dockview-theme-mikoto {
    --dv-paneview-active-outline-color: var(--chakra-colors-blue-500);
    --dv-tabs-and-actions-container-font-size: 13px;
    --dv-tabs-and-actions-container-height: 35px;
    --dv-drag-over-background-color: hsla(230, 16%, 27%, 0.5);
    --dv-drag-over-border-color: var(--chakra-colors-blue-500);
    --dv-tabs-container-scrollbar-color: var(--chakra-colors-gray-600);
    --dv-icon-hover-background-color: hsla(230, 16%, 35%, 0.5);
    --dv-floating-box-shadow: 8px 8px 16px 0px rgba(0, 0, 0, 0.4);
    --dv-overlay-z-index: 999;
    --dv-tab-font-size: 13px;
    --dv-border-radius: 0px;
    --dv-tab-margin: 0;
    --dv-sash-color: transparent;
    --dv-active-sash-color: var(--chakra-colors-blue-500);
    --dv-active-sash-transition-duration: 0.1s;
    --dv-active-sash-transition-delay: 0.3s;

    /* Background colors using Mikoto gray palette */
    --dv-group-view-background-color: var(--chakra-colors-gray-750);
    --dv-tabs-and-actions-container-background-color: var(
      --chakra-colors-gray-800
    );

    /* Active group tab colors */
    --dv-activegroup-visiblepanel-tab-background-color: var(
      --chakra-colors-gray-750
    );
    --dv-activegroup-hiddenpanel-tab-background-color: var(
      --chakra-colors-gray-800
    );

    /* Inactive group tab colors */
    --dv-inactivegroup-visiblepanel-tab-background-color: var(
      --chakra-colors-gray-750
    );
    --dv-inactivegroup-hiddenpanel-tab-background-color: var(
      --chakra-colors-gray-800
    );

    /* Tab divider and text colors */
    --dv-tab-divider-color: var(--chakra-colors-gray-700);
    --dv-activegroup-visiblepanel-tab-color: var(--chakra-colors-gray-50);
    --dv-activegroup-hiddenpanel-tab-color: var(--chakra-colors-gray-400);
    --dv-inactivegroup-visiblepanel-tab-color: var(--chakra-colors-gray-300);
    --dv-inactivegroup-hiddenpanel-tab-color: var(--chakra-colors-gray-500);

    /* Borders and separators */
    --dv-separator-border: var(--chakra-colors-gray-650);
    --dv-paneview-header-border-color: var(--chakra-colors-gray-500);
    --dv-scrollbar-background-color: hsla(230, 16%, 35%, 0.4);
  }

  .dockview-theme-mikoto
    .dv-drop-target-container
    .dv-drop-target-anchor.dv-drop-target-anchor-container-changed {
    opacity: 0;
    transition: none;
  }

  /* Show thin border between dockview panels on inside edges only */
  .dockview-theme-mikoto
    .dv-split-view-container.dv-horizontal
    > .dv-view-container
    > .dv-view:not(:first-child)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
    pointer-events: none;
    background-color: var(--dv-separator-border);
    height: 100%;
    width: 1px;
  }

  .dockview-theme-mikoto
    .dv-split-view-container.dv-vertical
    > .dv-view-container
    > .dv-view:not(:first-child)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
    pointer-events: none;
    background-color: var(--dv-separator-border);
    height: 1px;
    width: 100%;
  }

  input,
  textarea {
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

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
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

export const chakraSystem = createSystem(
  mergeConfigs(defaultConfig, chakraTheme),
);
