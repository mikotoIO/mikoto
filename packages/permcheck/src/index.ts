/**
 * The built-in permissions, by the name roles store and the API sends.
 *
 * These names are the API contract and must match superego's
 * `BUILTIN_NAMES` (a test there checks): never rename or reuse one. The
 * order here is the canonical order roles list their permissions in.
 */
export const permissions = {
  // Every permission, built-in or custom.
  superuser: 'superuser',

  // Management permissions
  manageSpace: 'manage_space',
  manageChannels: 'manage_channels',
  manageRoles: 'manage_roles',
  assignRoles: 'assign_roles',
  manageMemberProfiles: 'manage_member_profiles',
  manageInvites: 'manage_invites',
  manageEmojis: 'manage_emojis',
  manageMessages: 'manage_messages',
  manageBots: 'manage_bots',
  ban: 'ban',

  // channelwise permissions
  readChannel: 'read_channel',
  sendInChannel: 'send_in_channel',
  createSubChannels: 'create_sub_channels',
  manageSubChannels: 'manage_sub_channels',

  // Bypasses checks that moderators may skip (deleting messages, invites).
  moderator: 'moderator',
} as const;

export type BuiltinPermission = (typeof permissions)[keyof typeof permissions];

/** An extension-defined permission, `<namespace>:<name>`. */
export type CustomPermission = `${string}:${string}`;

export type Permission = BuiltinPermission | CustomPermission;

const BUILTIN_ORDER: readonly string[] = Object.values(permissions);

/** Longest permission name a role may hold (as on the server). */
export const MAX_NAME_LEN = 64;

const CUSTOM_PART = /^[a-z0-9_.-]+$/;

export function isBuiltinPermission(name: string): name is BuiltinPermission {
  return BUILTIN_ORDER.includes(name);
}

/**
 * Whether `name` is a well-formed custom permission: `<namespace>:<name>`,
 * both parts non-empty lowercase ASCII letters, digits, `_`, `-` or `.`.
 */
export function isCustomPermission(name: string): name is CustomPermission {
  if (name.length > MAX_NAME_LEN) return false;
  const i = name.indexOf(':');
  if (i < 0) return false;
  return (
    CUSTOM_PART.test(name.slice(0, i)) && CUSTOM_PART.test(name.slice(i + 1))
  );
}

/**
 * Whether `held` includes every permission in `rule`. This is plain set
 * membership: it doesn't let superusers through. For "can this member do
 * this", use `MikotoMember.checkPermission`, which does.
 */
export function checkPermission(
  rule: string | readonly string[],
  held: Iterable<string>,
): boolean {
  const set = held instanceof Set ? (held as Set<string>) : new Set(held);
  const rules = typeof rule === 'string' ? [rule] : rule;
  return rules.every((r) => set.has(r));
}

/**
 * Sort permission names as the server stores them: built-ins in
 * `permissions` order, then custom permissions alphabetically, without
 * duplicates.
 */
export function normalizePermissions(names: Iterable<string>): string[] {
  const unique = [...new Set(names)];
  const builtins = BUILTIN_ORDER.filter((p) => unique.includes(p));
  const rest = unique.filter((p) => !isBuiltinPermission(p)).sort();
  return [...builtins, ...rest];
}

/** `names` with `permission` added (`on`) or removed, normalized. */
export function setPermission(
  names: readonly string[],
  permission: string,
  on: boolean,
): string[] {
  return normalizePermissions(
    on ? [...names, permission] : names.filter((p) => p !== permission),
  );
}
