/** Joins class names, skipping falsy values. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
