---
name: chakra-ui
description: Contains Chakra UI v3 documentation for styling, theming, and components. ALWAYS activate when code imports from `@chakra-ui/react`, or when the user asks about Chakra UI components, styling, or theming.
---

# Chakra UI v3

## Activation

TRIGGER when: code imports from `@chakra-ui/react`, user asks about Chakra UI components/styling/theming, or working on frontend UI code.

## Documentation Files

This skill includes full Chakra UI v3 documentation split into three files stored alongside this SKILL.md:

- **`styling.txt`** (~110KB) - Styling system: style props, responsive design, CSS variables, dark mode, chakra factory, cascade layers, conditions, focus ring, text/layer/animation styles
- **`theming.txt`** (~88KB) - Theming: tokens (colors, spacing, radii, shadows, typography, z-index, animations, breakpoints), semantic tokens, recipes, slot recipes, customization
- **`components.txt`** (~1.5MB) - All component docs with usage examples and props

### How to use the docs

1. **Always read** `styling.txt` and `theming.txt` when this skill activates — they provide essential context for all Chakra UI work.
2. **Read `components.txt` on-demand** when working with specific components. Due to its size, use Grep to search for the component name (e.g. `# Button` or `# Dialog`) rather than reading the whole file.

The docs are located at: `/home/hayley/Projects/mikoto/.claude/skills/chakra-ui/`

## Project-Specific Context

- The project theme is defined at `apps/client/src/components/chakraTheme.tsx`
- The project uses the "Cactuspunk" design system: dark palette, sharp edges (0 border-radius), custom fonts
- All border-radius tokens are set to 0 except `full: 9999px` (for avatars/circles)

## Quick Reference

### Core Patterns

```tsx
// System setup
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    /* tokens, semanticTokens, recipes, slotRecipes */
  },
});

export const system = createSystem(defaultConfig, config);
```

```tsx
// Style props (primary styling method)
<Box bg="blue.500" p="4" borderRadius="md" color="white">
  Content
</Box>

// Responsive (mobile-first breakpoints)
<Box fontSize={{ base: "sm", md: "md", lg: "lg" }}>
  Responsive text
</Box>

// Color opacity via color-mix
<Box bg="red.300/40">Semi-transparent</Box>

// Semantic tokens (auto light/dark)
<Box bg="bg.subtle" color="fg.muted" borderColor="border">
  Themed content
</Box>
```

### chakra() Factory

```tsx
import { chakra } from "@chakra-ui/react"

// Create styled elements
const StyledDiv = chakra("div")
<StyledDiv bg="red.500" p="4" />

// With base styles
const Card = chakra("div", {
  base: { p: "4", bg: "bg.panel", shadow: "md" },
})

// Wrap custom components
const StyledCustom = chakra(MyComponent)
```

### Recipes & Slot Recipes

```tsx
import { defineRecipe, defineSlotRecipe } from '@chakra-ui/react';

// Single-part recipe
const buttonRecipe = defineRecipe({
  base: { fontWeight: 'bold' },
  variants: {
    visual: {
      solid: { bg: 'blue.500', color: 'white' },
      outline: { border: '1px solid', borderColor: 'blue.500' },
    },
    size: {
      sm: { px: '2', py: '1', fontSize: 'sm' },
      lg: { px: '4', py: '2', fontSize: 'lg' },
    },
  },
  defaultVariants: { visual: 'solid', size: 'sm' },
});

// Multi-part slot recipe
const cardRecipe = defineSlotRecipe({
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: { shadow: 'md', borderRadius: 'md' },
    header: { fontWeight: 'bold', p: '4' },
    body: { p: '4' },
  },
});
```

### Composition with asChild

```tsx
// Passes Chakra styles to child element
<Button asChild>
  <a href="/link">Click me</a>
</Button>
```

### Key Semantic Tokens

| Category   | Tokens                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Background | `bg`, `bg.subtle`, `bg.muted`, `bg.emphasized`, `bg.inverted`, `bg.panel`, `bg.error`, `bg.warning`, `bg.success`, `bg.info` |
| Text       | `fg`, `fg.muted`, `fg.subtle`, `fg.inverted`, `fg.error`, `fg.warning`, `fg.success`, `fg.info`                              |
| Border     | `border`, `border.muted`, `border.subtle`, `border.emphasized`, `border.inverted`, `border.error`                            |

### CSS Cascade Layers

```
@layer reset, base, tokens, recipes;
```

Styles are ordered by specificity layers for predictable overrides.
