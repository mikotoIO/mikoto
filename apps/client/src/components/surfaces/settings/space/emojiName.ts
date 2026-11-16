/** Server rule for custom emoji names. */
export const EMOJI_NAME = /^[A-Za-z0-9_]{2,32}$/;

/** Largest emoji image the media server's `emoji` store accepts. */
export const MAX_EMOJI_BYTES = 512 * 1024;

export const EMOJI_TYPES = [
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpeg',
];

/**
 * A valid emoji name for an uploaded file: its name without the extension,
 * with anything but letters, digits and underscores turned into `_`, and a
 * numeric suffix if the space already has that name (ignoring case).
 */
export function emojiNameFromFile(
  filename: string,
  taken: Iterable<string>,
): string {
  const used = new Set(Array.from(taken, (n) => n.toLowerCase()));
  let base = filename
    .replace(/\.[^.]*$/, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  if (base.length < 2) base = `emoji${base ? `_${base}` : ''}`;
  if (!used.has(base.toLowerCase())) return base;
  for (let i = 2; ; i++) {
    const suffix = `_${i}`;
    const name = base.slice(0, 32 - suffix.length) + suffix;
    if (!used.has(name.toLowerCase())) return name;
  }
}
