# Mikoto Developer Documentation

A [Fumadocs](https://fumadocs.dev)-based Next.js site that serves developer
documentation for the Mikoto monorepo. Lives under `apps/docs/`.

## Develop

```sh
pnpm install              # at the repo root
moon run docs:dev         # or: pnpm --filter docs dev
```

The site runs at <http://localhost:3514>.

## Build

```sh
moon run docs:build
```

## Write a new page

1. Add an MDX file under `content/docs/`. Use frontmatter:

   ```mdx
   ---
   title: My Page
   description: One-line summary that shows up in lists and metadata.
   ---

   Body goes here.
   ```

2. (Optional) Update the nearest `meta.json` to control sidebar order
   and grouping. Pages without a `meta.json` entry are sorted
   alphabetically by filename.

3. Reload the dev server — Fumadocs picks up the file via the `.source/`
   collection it regenerates from `source.config.ts`.

## Layout

| Path                            | What it does                                   |
| ------------------------------- | ---------------------------------------------- |
| `source.config.ts`              | Declares the MDX collection (`content/docs/`). |
| `lib/source.ts`                 | Loader that the Fumadocs UI reads from.        |
| `lib/layout.shared.tsx`         | Shared nav config (title, GitHub URL).         |
| `app/layout.tsx`                | Root layout with `RootProvider`.               |
| `app/page.tsx`                  | Landing page outside the docs sidebar.         |
| `app/docs/layout.tsx`           | Docs shell with sidebar/header.                |
| `app/docs/[[...slug]]/page.tsx` | Renders a single MDX page.                     |
| `app/api/search/route.ts`       | Server-side search endpoint.                   |
| `content/docs/`                 | All authored MDX content.                      |
