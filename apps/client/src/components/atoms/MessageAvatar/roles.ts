import type { MikotoMember, MikotoRole } from '@mikoto-io/mikoto.js';

/** The member's roles (minus @everyone), highest position first. */
export function sortedRoles(member?: MikotoMember | null): MikotoRole[] {
  const space = member?.space;
  if (!member || !space) return [];
  const roles: MikotoRole[] = [];
  for (const id of member.roleIds) {
    const role = space.roles._get(id);
    if (role && role.name !== '@everyone') roles.push(role);
  }
  return roles.toSorted((a, b) => b.position - a.position);
}

/**
 * Props for `<RoleName>`: the color and name of the member's
 * highest-positioned role that has a color. Returns nothing outside a space,
 * so DMs never get colored names.
 */
export function roleNameProps(member?: MikotoMember | null): {
  roleColor?: string;
  roleName?: string;
} {
  const top = sortedRoles(member).find((r) => r.color);
  if (!top?.color) return {};
  return { roleColor: top.color, roleName: top.name };
}
