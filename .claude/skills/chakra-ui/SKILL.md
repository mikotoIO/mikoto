---
name: chakra-ui
description: Contains Chakra UI v3 documentation for styling, theming, and components. ALWAYS activate when code imports from `@chakra-ui/react`, or when the user asks about Chakra UI components, styling, or theming.
---

# Chakra UI v3

## Activation

TRIGGER when: code imports from `@chakra-ui/react`, user asks about Chakra UI components/styling/theming, or working on frontend UI code.

## Important Files

This skill includes full Chakra UI v3 documentation split into three files stored alongside this SKILL.md:

- **`styling.txt`** (~110KB) - Styling system: style props, responsive design, CSS variables, dark mode, chakra factory, cascade layers, conditions, focus ring, text/layer/animation styles
- **`theming.txt`** (~88KB) - Theming: tokens (colors, spacing, radii, shadows, typography, z-index, animations, breakpoints), semantic tokens, recipes, slot recipes, customization
- **`components.txt`** (~1.5MB) - All component docs with usage examples and props

**Always read** `styling.txt` and `theming.txt` when this skill activates — they provide essential context for all Chakra UI work.
but, **Read `components.txt` on-demand** when working with specific components. Due to its size, use ripgrep to search for the component name (e.g. `# Button` or `# Dialog`) rather than reading the whole file.

- The docs are located at: `/home/hayley/Projects/mikoto/.claude/skills/chakra-ui/`
- The project theme is defined at `apps/client/src/components/chakraTheme.tsx`

## Quick Reference

### Core Patterns

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

### Composition with asChild

```tsx
// Passes Chakra styles to child element
<Button asChild>
  <a href="/link">Click me</a>
</Button>
```

### Footguns

AVOID using `chakra()` factory to create styled elements.
AVOID using styled components
AVOID using recipes and slot recipes

When trying to re-use styles, simply create a component and use it.
Chakra defines our style system but we use a utility-first approach, similar to Tailwind.

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
