import { describe, expect, test } from 'vitest';

import { EMOJI_NAME, emojiNameFromFile } from './emojiName';

describe('emojiNameFromFile', () => {
  test('keeps simple names and drops the extension', () => {
    expect(emojiNameFromFile('party_parrot.gif', [])).toBe('party_parrot');
  });

  test('replaces characters the server rejects', () => {
    expect(emojiNameFromFile('Blob Wave (2).png', [])).toBe('Blob_Wave_2');
    expect(emojiNameFromFile('ねこ.png', [])).toBe('emoji');
    expect(emojiNameFromFile('a.png', [])).toBe('emoji_a');
  });

  test('truncates to 32 characters', () => {
    const name = emojiNameFromFile(`${'x'.repeat(40)}.png`, []);
    expect(name).toHaveLength(32);
  });

  test('avoids names already in the space, ignoring case', () => {
    expect(emojiNameFromFile('blob.png', ['Blob'])).toBe('blob_2');
    expect(emojiNameFromFile('blob.png', ['blob', 'blob_2'])).toBe('blob_3');
    const long = 'y'.repeat(32);
    expect(emojiNameFromFile(`${long}.png`, [long])).toBe(
      `${'y'.repeat(30)}_2`,
    );
  });

  test('always produces a name the server accepts', () => {
    for (const file of ['.png', '-.gif', 'a b c', '!!!.webp', 'ok.png']) {
      expect(emojiNameFromFile(file, [])).toMatch(EMOJI_NAME);
    }
  });
});
