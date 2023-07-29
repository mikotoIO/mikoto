import { Member, Space } from 'mikotojs';

export function computeRoleColor(space: Space, member: Member) {
  // eslint-disable-next-line no-restricted-syntax
  for (const roleId of member.roleIds) {
    const role = space.roles.find((x) => x.id === roleId);
    if (role && role.color) {
      return role.color;
    }
  }
  return undefined;
}
