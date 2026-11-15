# Mikoto design system (working name: Shoji)

Shoji are paper panels set in a darker wooden frame. That is the layout:
every tab is a **sheet** inset on a darker **base**, tabs sit on the base
above their sheet, and panes are separated by gaps, not borders.

Import everything from `@/design`. Style with **CSS Modules**
(`Foo.module.css` next to `Foo.tsx`) that use the tokens in `tokens.css`.
No Chakra, no Emotion, no inline hex colors.

## Principles

1. **Quiet by default.** Neutral surfaces, one accent, hairline dividers. The
   identity comes from structure (sheets on a base) and type, not decoration.
   No gradients, glows or drop shadows on in-flow content (shadows are for
   floating things: menus, dialogs, toasts).
2. **Everything is customizable through tokens.** Theme, accent, tint,
   density, corner radius, typeface and text size are user preferences
   (`appearance.ts`). Never hard-code a size, radius, color or font that a
   token covers, or the preference silently stops working.
3. **Focus is shown with fills, not outlines.** The focused pane's active
   tab is a filled pill; the message box gets a slightly stronger neutral
   border. No accent rings around panels or inputs. (Keyboard
   `:focus-visible` rings on buttons/links stay; they're accessibility.)
4. **Render what you know immediately; skeleton the rest** (see Loading).
5. **Every region fails alone** (see Errors).
6. **Words are UI.** Sentence case. Buttons say what they do ("Save
   changes", "Create channel"), and the toast echoes it ("Channel
   created"). Errors say what happened and how to fix it; they never
   apologize and never say only "something went wrong". Empty states invite
   the next action. No ALL CAPS labels.

## Tokens (tokens.css)

| Group   | Tokens                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Surface | `--base` (app frame, sidebars) `--sheet` (tab content) `--raised` (inputs, hovers, code) `--overlay` (menus, dialogs, toasts) |
| State   | `--hover` `--press`                                                                                                           |
| Lines   | `--line` (dividers) `--line-strong` (control borders)                                                                         |
| Text    | `--text` `--muted` (secondary) `--faint` (meta, timestamps)                                                                   |
| Accent  | `--accent` `--on-accent` (text on accent) `--accent-ink` (accent-colored text) `--accent-soft` (tinted bg)                    |
| Status  | `--danger` `--warn` `--ok` and `--*-soft`                                                                                     |
| Type    | `--font-ui` `--font-mono`; sizes `--text-xs` … `--text-3xl` (scale with the user's text size)                                 |
| Space   | `--space-1` (4px) … `--space-10` (40px)                                                                                       |
| Shape   | `--r-sheet` (panes, dialogs, cards) `--r-ctl` (buttons, inputs, rows) `--r-pill`                                              |
| Density | `--row` (nav row height) `--ctl-h` `--ctl-h-sm` `--av` (message avatar) `--msg-pad`                                           |
| Motion  | `--dur-fast` `--dur` `--ease` (zero when the user reduces motion)                                                             |
| Layers  | `--z-dropdown` `--z-dialog` `--z-menu` `--z-toast` `--z-tooltip`                                                              |

There is one typeface family for everything (the user's choice; Inter by
default). Hierarchy comes from size and weight (400/500/600), not from a
second display face.

## Components

- **Button** `variant: primary | secondary | ghost | danger | dangerGhost`,
  `size: sm | md | lg`, `loading`, `block`. One primary per view.
- **IconButton** (requires `aria-label`, shows it as a tooltip via `title`).
- **Field** `label description error required orientation`. Wrap any
  control; ids and aria wiring are automatic. `orientation="horizontal"`
  is the settings-row layout (text left, control right).
- **Input / Textarea / Select** (native select, styled) work with
  react-hook-form `register()`.
- **Checkbox / Switch** (`checked onCheckedChange label`),
  **SegmentedControl** (one-of-few), **Slider**.
- **Form**: vertical stack with the standard field spacing.
- **Dialog** + **DialogContent** `title description footer size`.
  Modals opened through `useModalKit()` render a `<DialogContent>`; the
  host provides the `<Dialog>` root.
- **Menu / MenuTrigger / MenuContent / MenuItem / MenuSeparator** for
  dropdowns. For right-click menus use `useContextMenu` +
  `<ContextMenu><ContextMenu.Item icon danger>` (`components/ContextMenu`).
- **Popover / PopoverTrigger / PopoverContent**, **Tooltip**
  (`<Tooltip content="Mute"><IconButton…/></Tooltip>`).
- **Badge** (unread / `mention` counts), **Dot**, **Tag** (`tone` or role
  `color`), **Kbd**, **Stack** (flex helper for trivial layout).
- **PaneHeader** `icon title topic actions`: the 50px bar on top of every
  tab. **PageTitle**, **Section** for page-like tabs (settings).
- **RoleName** `name roleColor roleName`: member names. Follows the user's
  "Colored names / Role tags" preference and clamps role colors per theme so
  they always meet WCAG AA. Never color names outside a space (DMs, Home).
- **toast({ title, description, type, action })**: from anywhere.
- Icons: **lucide-react**, 16px in rows/buttons, 14px in dense rows,
  `strokeWidth` default. Decorative icons get `aria-hidden`.

## Loading

The model, implemented by `Skeleton.tsx`:

1. Render what's already known right away (channel name, icon, topic, the
   pane header). Only the unknown part waits.
2. Show nothing for 150ms. Fast loads never flash a skeleton.
3. Then show a **skeleton that mirrors the real layout** (same row heights,
   avatar sizes and gaps), so nothing jumps when content lands. Never a
   centered spinner for content that has a shape.
4. A visible skeleton stays at least 300ms, then content fades in.
5. Refetches never blank content that's already on screen. Use
   `placeholderData: keepPreviousData` / `useTransition` instead of
   re-suspending. Prefetch on hover where navigation is predictable.

APIs: `<Suspense fallback={<DelayedFallback><XSkeleton/></DelayedFallback>}>`;
`<Deferred loading skeleton>` or `useSkeletonVisible(loading)` for flags;
`Skeleton`, `SkeletonText`, `SkeletonGroup label` (announces "Loading …").
`Spinner` is only for actions in progress (a pressed button).

## Errors

Three tiers. Every boundary resets React Query errors on retry.

- **SurfaceErrorBoundary `what="#general"`**: around a whole tab. Shows
  "#general didn't load", a plain-language reason (`describeError`),
  _Try again_, _Copy details_, and collapsible technical details.
- **RegionErrorBoundary `what="Members"`**: around independent regions
  (member list, sidebar sections, embeds, doc toolbar). The rest of the tab
  keeps working.
- **ItemErrorBoundary `what="This message"`**: around list items. One
  broken message renders a one-line dashed row instead of killing the list.

For actions (mutations), show the failure where it happened: a field
`error`, a failed message with _Try again / Delete_ inline, or
`toast({ type: 'error', title: "Couldn't delete the channel", description })`
with the reason from `describeError(err).message`.

## Customization surface

`appearance.ts` holds the preferences and `applyAppearance()` writes them to
`<html>`. `activeSpaceAccentAtom` is set by the shell from the focused tab's
space (`spaceAccent(space)`); when the user has **Space colors** on (the
default) that space's accent replaces theirs while they're in it. Home always
uses the user's accent.
