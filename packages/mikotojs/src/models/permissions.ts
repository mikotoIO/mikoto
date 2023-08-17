/* eslint-disable no-bitwise */
import { permissions, checkPermission } from '@mikoto-io/permcheck';

import { ClientMember } from '../store';

export function checkMemberPermission(
  subject: ClientMember,
  action: string | bigint,
  // while most actions can be overridden by superuser, some actions cannot
  superuserOverride = true,
) {
  // space owners can override any permissions, regardless of role
  if (subject.isSpaceOwner) return true;

  let act = typeof action === 'string' ? BigInt(action) : action;
  if (superuserOverride) {
    act |= permissions.superuser;
  }
  const totalPerms = subject.roles.reduce(
    (acc, x) => acc | BigInt(x.permissions),
    0n,
  );

  return checkPermission(act, totalPerms);
}
