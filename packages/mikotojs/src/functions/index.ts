/* eslint-disable no-bitwise */
import { checkPermission } from '@mikoto-io/permcheck';

import { ClientMember } from '../store';

export function checkMemberPermission(
  subject: ClientMember,
  action: string | bigint,
  // while most actions can be overridden by superuser, some actions cannot
) {
  // space owners can override any permissions, regardless of role
  if (subject.isSpaceOwner) return true;

  const act = typeof action === 'string' ? BigInt(action) : action;
  const totalPerms = subject.roles.reduce(
    (acc, x) => acc | BigInt(x.permissions),
    0n,
  );

  return checkPermission(act, totalPerms);
}
