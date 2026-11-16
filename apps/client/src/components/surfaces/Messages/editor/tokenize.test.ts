import { describe, expect, test } from 'vitest';

import { type Segment, tokenize } from './tokenize';

const ID = '3f2a9c1e-0b7d-4c55-9a51-2d4e8f6a7b10';
const opts = {
  isStandardEmoji: (code: string) => ['smile', '+1', 'heart'].includes(code),
  customEmojiByName: (name: string) =>
    name.toLowerCase() === 'blob' ? { id: ID, name: 'blob' } : undefined,
};

/** A compact view: `text`, `[kind:text]`, `{emoji}`, `/` for breaks. */
function show(segments: Segment[]) {
  return segments
    .map((s) => {
      switch (s.type) {
        case 'text':
          return s.text;
        case 'break':
          return '/';
        case 'mark':
          return `[${s.kind}:${s.text}]`;
        case 'emoji':
          return s.emoji.kind === 'standard'
            ? `{${s.emoji.code}}`
            : `{custom ${s.emoji.name}}`;
      }
    })
    .join('|');
}

describe('tokenize', () => {
  test('joins back to the input (lossless)', () => {
    const inputs = [
      'plain',
      '**bold** and *it* _also_ ~~gone~~ ||secret|| `code`',
      'hey @kuroko.s, :smile: :nope: :+1:',
      `custom <emoji:${ID}:blob> ok`,
      'line one\n\nline **three**',
      '```\nfn x() { **not bold** }\n```\nafter @me',
      'see https://example.com/a?b=c.',
      'escaped \\@nope \\:smile: \\*no\\*',
    ];
    for (const input of inputs) {
      expect(
        tokenize(input, opts)
          .map((s) => s.text)
          .join(''),
      ).toBe(input);
    }
  });

  test('inline formatting', () => {
    expect(show(tokenize('**b** *i* _u_ ~~s~~ ||sp|| `c`'))).toBe(
      '[bold:**b**]| |[italic:*i*]| |[italic:_u_]| |[strike:~~s~~]| |[spoiler:||sp||]| |[code:`c`]',
    );
  });

  test('unfinished or empty markers stay plain', () => {
    expect(show(tokenize('**bold'))).toBe('**bold');
    expect(show(tokenize('** x **'))).toBe('** x **');
    expect(show(tokenize('a * b * c'))).toBe('a * b * c');
    expect(show(tokenize('snake_case_name'))).toBe('snake_case_name');
  });

  test('code wins over what is inside it', () => {
    expect(show(tokenize('`**x** @y :smile:`', opts))).toBe(
      '[code:`**x** @y :smile:`]',
    );
  });

  test('mentions and links', () => {
    expect(show(tokenize('hi @bob. mail a@b.c', opts))).toBe(
      'hi |[mention:@bob]|. mail a@b.c',
    );
    expect(show(tokenize('go to https://x.io/p, now'))).toBe(
      'go to |[link:https://x.io/p]|, now',
    );
  });

  test('standard shortcodes become emoji anywhere', () => {
    expect(show(tokenize(':smile::heart: :nope:', opts))).toBe(
      '{smile}|{heart}| :nope:',
    );
  });

  test('custom emoji objects', () => {
    const [seg] = tokenize(`<emoji:${ID.toUpperCase()}:blob>`, opts);
    expect(seg).toEqual({
      type: 'emoji',
      emoji: { kind: 'custom', id: ID, name: 'blob' },
      text: `<emoji:${ID.toUpperCase()}:blob>`,
    });
  });

  test('a typed :name: becomes a custom emoji only as it is closed', () => {
    expect(show(tokenize('hi :blob:', opts))).toBe('hi :blob:');
    const typed = tokenize('hi :blob:', { ...opts, caret: 9 });
    expect(show(typed)).toBe('hi |{custom blob}');
    // ...and is then written as the object that gets sent
    expect(typed[1].text).toBe(`<emoji:${ID}:blob>`);
  });

  test('line breaks and code fences', () => {
    expect(show(tokenize('a\n**b**\n\nc'))).toBe('a|/|[bold:**b**]|/|/|c');
    expect(show(tokenize('```\n**x**\n```\n*y*'))).toBe(
      '[codeBlock:```]|/|[codeBlock:**x**]|/|[codeBlock:```]|/|[italic:*y*]',
    );
  });

  test('escapes are respected', () => {
    expect(show(tokenize('\\@me \\:smile: \\*x*', opts))).toBe(
      '\\@me \\:smile: \\*x*',
    );
  });
});
