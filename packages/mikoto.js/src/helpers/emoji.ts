/**
 * Custom emoji appear in message markdown as an object link,
 * `<emoji:ID:name>`: the id says which emoji, and the name is what to show
 * where it can't be resolved (it is not used to look the emoji up).
 */

/** Matches one custom emoji object. Groups: id, name. */
export const EMOJI_OBJECT_PATTERN =
  /<emoji:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):(\w{1,32})>/;

/** The markdown for a custom emoji. */
export function formatEmoji(emoji: { id: string; name: string }): string {
  return `<emoji:${emoji.id}:${emoji.name}>`;
}

/** Parses exactly one custom emoji object, e.g. a whole `<emoji:…>` token. */
export function parseEmoji(text: string): { id: string; name: string } | null {
  const match = new RegExp(`^${EMOJI_OBJECT_PATTERN.source}$`).exec(text);
  return match ? { id: match[1].toLowerCase(), name: match[2] } : null;
}

/** Parses the `href` an `<emoji:…>` autolink turns into (`emoji:ID:name`). */
export function parseEmojiHref(href: string) {
  return parseEmoji(`<${href}>`);
}
