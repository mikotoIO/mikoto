/**
 * Expiry of a JWT in ms since epoch, or null if it can't be read. The
 * signature isn't checked: this only decides when to refresh.
 */
export function tokenExpiry(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data: unknown = JSON.parse(json);
    if (
      typeof data === 'object' &&
      data !== null &&
      'exp' in data &&
      typeof data.exp === 'number'
    ) {
      return data.exp * 1000;
    }
  } catch {
    // not a JWT we can read
  }
  return null;
}
