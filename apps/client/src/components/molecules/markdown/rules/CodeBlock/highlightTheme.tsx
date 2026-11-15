import type { CSSProperties } from 'react';

/*
 * One Dark-inspired highlight theme expressed in design tokens, so it follows
 * the light and dark themes. The `--hl-*` colors are defined on the code block
 * (see Markdown.module.css `.codeBlock`).
 */
const KEYWORD = { color: 'var(--hl-keyword)' };
const NAME = { color: 'var(--hl-name)' };
const LITERAL = { color: 'var(--hl-literal)' };
const STRING = { color: 'var(--hl-string)' };
const BUILTIN = { color: 'var(--hl-builtin)' };
const NUMBER = { color: 'var(--hl-number)' };
const TITLE = { color: 'var(--hl-title)' };
const COMMENT = { color: 'var(--faint)', fontStyle: 'italic' };

export const highlightTheme: Record<string, CSSProperties> = {
  hljs: {
    display: 'block',
    color: 'var(--text)',
    background: 'transparent',
  },
  'hljs-comment': COMMENT,
  'hljs-quote': COMMENT,
  'hljs-doctag': KEYWORD,
  'hljs-keyword': KEYWORD,
  'hljs-formula': KEYWORD,
  'hljs-section': NAME,
  'hljs-name': NAME,
  'hljs-selector-tag': NAME,
  'hljs-deletion': NAME,
  'hljs-subst': NAME,
  'hljs-literal': LITERAL,
  'hljs-string': STRING,
  'hljs-regexp': STRING,
  'hljs-addition': STRING,
  'hljs-attribute': STRING,
  'hljs-meta-string': STRING,
  'hljs-built_in': BUILTIN,
  'hljs-class .hljs-title': BUILTIN,
  'hljs-attr': NUMBER,
  'hljs-variable': NUMBER,
  'hljs-template-variable': NUMBER,
  'hljs-type': NUMBER,
  'hljs-selector-class': NUMBER,
  'hljs-selector-attr': NUMBER,
  'hljs-selector-pseudo': NUMBER,
  'hljs-number': NUMBER,
  'hljs-symbol': TITLE,
  'hljs-bullet': TITLE,
  'hljs-link': { ...TITLE, textDecoration: 'underline' },
  'hljs-meta': TITLE,
  'hljs-selector-id': TITLE,
  'hljs-title': TITLE,
  'hljs-emphasis': { fontStyle: 'italic' },
  'hljs-strong': { fontWeight: 'bold' },
};
