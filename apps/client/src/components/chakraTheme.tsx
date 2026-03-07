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
    recipes: {
      input: {
        variants: {
          variant: {
            outline: {
              bg: 'gray.700',
              borderStyle: 'solid',
              borderColor: 'gray.600',
              focusVisibleRing: 'none',
              _focusVisible: {
                borderColor: 'gray.550',
              },
            },
          },
        },
      },
      textarea: {
        variants: {
          variant: {
            outline: {
              bg: 'gray.700',
              borderStyle: 'solid',
              borderColor: 'gray.600',
              focusVisibleRing: 'none',
              _focusVisible: {
                borderColor: 'gray.550',
              },
            },
          },
        },
      },
    },
    tokens: {
      colors: {
        gray: {
          900: { value: '#0A0A0C' },
          850: { value: '#0D0D10' },
          800: { value: '#141418' },
          750: { value: '#1C1C22' },
          700: { value: '#26262E' },
          650: { value: '#2E2E38' },
          600: { value: '#3A3A46' },
          550: { value: '#4A4A56' },
          500: { value: '#6B7280' },
          450: { value: '#7C8290' },
          400: { value: '#9CA3AF' },
          350: { value: '#B0B6C0' },
          300: { value: '#D1D5DB' },
          250: { value: '#DCDFE4' },
          200: { value: '#E5E7EB' },
          150: { value: '#ECEEF1' },
          100: { value: '#F3F4F6' },
          50: { value: '#F9FAFB' },
        },
        blue: {
          900: { value: '#1E3A8A' },
          800: { value: '#1E40AF' },
          700: { value: '#1D4ED8' },
          600: { value: '#2563EB' },
          500: { value: '#3B82F6' },
          400: { value: '#60A5FA' },
          300: { value: '#93C5FD' },
          200: { value: '#BFDBFE' },
          100: { value: '#DBEAFE' },
          50: { value: '#EFF6FF' },
        },
        cyan: {
          900: { value: '#164E63' },
          800: { value: '#155E75' },
          700: { value: '#0E7490' },
          600: { value: '#0891B2' },
          500: { value: '#06B6D4' },
          400: { value: '#22D3EE' },
          300: { value: '#67E8F9' },
          200: { value: '#A5F3FC' },
          100: { value: '#CFFAFE' },
          50: { value: '#ECFEFF' },
        },
        magenta: {
          900: { value: '#831843' },
          800: { value: '#9D174D' },
          700: { value: '#BE185D' },
          600: { value: '#DB2777' },
          500: { value: '#EC4899' },
          400: { value: '#F472B6' },
          300: { value: '#F9A8D4' },
          200: { value: '#FBCFE8' },
          100: { value: '#FCE7F3' },
          50: { value: '#FDF2F8' },
        },
        purple: {
          900: { value: '#4C1D95' },
          800: { value: '#5B21B6' },
          700: { value: '#6D28D9' },
          600: { value: '#7C3AED' },
          500: { value: '#8B5CF6' },
          400: { value: '#A78BFA' },
          300: { value: '#C4B5FD' },
          200: { value: '#DDD6FE' },
          100: { value: '#EDE9FE' },
          50: { value: '#F5F3FF' },
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
        primary: {
          solid: { value: '{colors.blue.600}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.blue.500}' },
          muted: { value: '{colors.blue.200}' },
          subtle: { value: '{colors.blue.900}' },
          emphasized: { value: '{colors.blue.800}' },
          focusRing: { value: '{colors.blue.500}' },
        },
        text: { value: '{colors.gray.50}' },
        surface: { value: '{colors.gray.750}' },
        subsurface: { value: '{colors.gray.800}' },
      },
    },
  },
});

export const globalCss = css`
  :root {
    --font-heading: 'Outfit', sans-serif;
    --font-main: 'Inter', sans-serif;
    --font-code: 'JetBrains Mono', monospace;

    --bg-page: var(--chakra-colors-gray-900);
    --bg-dark: var(--chakra-colors-gray-850);
    --bg-mid: var(--chakra-colors-gray-800);
    --bg-light: var(--chakra-colors-gray-750);
    --bg-lighter: var(--chakra-colors-gray-700);
    --border: var(--chakra-colors-gray-650);
    --text-primary: #ffffff;
    --text-secondary: var(--chakra-colors-gray-400);
    --text-dim: var(--chakra-colors-gray-500);
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
    > .dv-view:not(:first-of-type)::before {
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
    > .dv-view:not(:first-of-type)::before {
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

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
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
