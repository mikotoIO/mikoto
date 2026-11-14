const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A space's owner-defined accent color, or null. Reads defensively so it
 * works with any space-shaped object (and before/after the API exposes it).
 */
export function spaceAccent(space: object | null | undefined): string | null {
  if (!space || !('accent' in space)) return null;
  const { accent } = space;
  return typeof accent === 'string' && HEX.test(accent) ? accent : null;
}
