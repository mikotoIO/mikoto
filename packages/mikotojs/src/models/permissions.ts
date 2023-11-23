/* eslint-disable no-bitwise */
import { checkPermission, permissions } from '@mikoto-io/permcheck';

import { ClientMember } from '../store';

// asserts that the subject has the lower permission level than the principal
export function checkPermissionLevel(
  principal: ClientMember,
  subject: ClientMember,
) {
  // get highest permission level for both
  const principalLevel = Math.max(...principal.roles.map((x) => x.position));
  const subjectLevel = Math.max(...subject.roles.map((x) => x.position));

  return subjectLevel < principalLevel;
}

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
