import type { Role } from '@mikoto-io/mikoto.js';

import { Tag } from '@/design';

/** A role as a tag in the role's color (contrast-clamped per theme). */
export function RoleBadge({ role }: { role: Role }) {
  return <Tag color={role.color}>{role.name}</Tag>;
}
