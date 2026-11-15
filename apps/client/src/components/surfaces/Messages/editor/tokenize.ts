import { EMOJI_OBJECT_PATTERN, formatEmoji } from '@mikoto-io/mikoto.js';

/*
 * Splits message markdown into the pieces the composer styles. The
 * composer's text stays exactly the markdown that gets sent: every segment's
 * `text` is the source it came from, so joining them gives the input back.
 */

export type MarkKind =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'spoiler'
  | 'code'
  | 'codeBlock'
  | 'mention'
  | 'link';

export type EmojiRef =
  | { kind: 'standard'; code: string }
  | { kind: 'custom'; id: string; name: string };

export type Segment =
  | { type: 'text'; text: string }
  | { type: 'mark'; kind: MarkKind; text: string }
  | { type: 'emoji'; emoji: EmojiRef; text: string }
  | { type: 'break'; text: '\n' };

export interface TokenizeOptions {
  /** Whether `:code:` is a standard emoji shortcode. */
  isStandardEmoji?: (code: string) => boolean;
  /** The custom emoji a typed `:name:` stands for, if any. */
  customEmojiByName?: (
    name: string,
  ) => { id: string; name: string } | undefined;
  /**
   * Where a collapsed caret is. A typed `:name:` becomes a custom emoji only
   * right as its closing colon is typed, so loading a message for editing
   * never rewrites text that happens to match an emoji's name.
   */
  caret?: number | null;
}

interface Matcher {
  re: RegExp;
  make: (m: RegExpExecArray, opts: TokenizeOptions) => Segment | null;
}

const mark =
  (kind: MarkKind) =>
  (m: RegExpExecArray): Segment => ({ type: 'mark', kind, text: m[0] });

/** In priority order: at the same position, earlier ones win. */
const INLINE: Matcher[] = [
  { re: /`[^`\n]+`/g, make: mark('code') },
  {
    re: new RegExp(EMOJI_OBJECT_PATTERN.source, 'g'),
    make: (m) => ({
      type: 'emoji',
      emoji: { kind: 'custom', id: m[1].toLowerCase(), name: m[2] },
      text: m[0],
    }),
  },
  {
    re: /(?<!\\):([\w+-]+):/g,
    make: (m, opts) => {
      const code = m[1];
      if (opts.isStandardEmoji?.(code)) {
        return { type: 'emoji', emoji: { kind: 'standard', code }, text: m[0] };
      }
      const custom = opts.customEmojiByName?.(code);
      if (custom && opts.caret === m.index + m[0].length) {
        // Becomes the id-based object that's actually sent.
        return {
          type: 'emoji',
          emoji: { kind: 'custom', id: custom.id, name: custom.name },
          text: formatEmoji(custom),
        };
      }
      return null;
    },
  },
  { re: /(?<!\\)\*\*(?!\s)[^\n]*?\S\*\*/g, make: mark('bold') },
  { re: /(?<!\\)~~(?!\s)[^~\n]*?[^\s~]~~/g, make: mark('strike') },
  { re: /(?<!\\)\|\|[^\n]+?\|\|/g, make: mark('spoiler') },
  {
    re: /(?<![\\*])\*(?![\s*])[^*\n]*?[^\s*\\]\*(?!\*)/g,
    make: mark('italic'),
  },
  { re: /(?<![\w\\])_(?![\s_])[^_\n]*?[^\s_]_(?!\w)/g, make: mark('italic') },
  { re: /(?<![\w\\])@[\w.]*\w/g, make: mark('mention') },
  {
    re: /\bhttps?:\/\/[^\s<>]*[^\s<>.,:;!?"')\]]/g,
    make: mark('link'),
  },
];

const FENCE = /```[\s\S]*?```/g;

interface Found {
  start: number;
  end: number;
  segment: Segment;
}

function firstMatch(
  m: Matcher,
  text: string,
  from: number,
  opts: TokenizeOptions,
): Found | null {
  m.re.lastIndex = from;
  for (let r = m.re.exec(text); r; r = m.re.exec(text)) {
    const segment = m.make(r, opts);
    if (segment) {
      return { start: r.index, end: r.index + r[0].length, segment };
    }
    m.re.lastIndex = r.index + 1;
  }
  return null;
}

/** Inline tokens of a stretch of text with no code fences. */
function tokenizeInline(
  text: string,
  offset: number,
  opts: TokenizeOptions,
  out: Segment[],
) {
  // Matchers see positions relative to `text`; the caret is absolute.
  const local: TokenizeOptions = {
    ...opts,
    caret: opts.caret == null ? opts.caret : opts.caret - offset,
  };
  let pos = 0;
  while (pos < text.length) {
    let best: Found | null = null;
    for (const m of INLINE) {
      const found = firstMatch(m, text, pos, local);
      if (found && (!best || found.start < best.start)) best = found;
    }
    if (!best) break;
    if (best.start > pos) pushText(out, text.slice(pos, best.start));
    out.push(best.segment);
    pos = best.end;
  }
  if (pos < text.length) pushText(out, text.slice(pos));
}

/** Adds plain text, as text and line-break segments. */
function pushText(out: Segment[], text: string) {
  text.split('\n').forEach((line, i) => {
    if (i > 0) out.push({ type: 'break', text: '\n' });
    if (!line) return;
    const last = out.at(-1);
    if (last?.type === 'text') last.text += line;
    else out.push({ type: 'text', text: line });
  });
}

export function tokenize(text: string, opts: TokenizeOptions = {}): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  FENCE.lastIndex = 0;
  for (let f = FENCE.exec(text); f; f = FENCE.exec(text)) {
    tokenizeInline(text.slice(pos, f.index), pos, opts, out);
    f[0].split('\n').forEach((line, i) => {
      if (i > 0) out.push({ type: 'break', text: '\n' });
      if (line) out.push({ type: 'mark', kind: 'codeBlock', text: line });
    });
    pos = f.index + f[0].length;
  }
  tokenizeInline(text.slice(pos), pos, opts, out);
  return out;
}
