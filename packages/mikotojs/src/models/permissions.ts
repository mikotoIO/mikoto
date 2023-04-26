/* eslint-disable no-bitwise */
export const spacePermissions = {
  superuser: 1n << 0n,
  manageSpace: 1n << 1n,
  manageChannels: 1n << 2n,
  manageRoles: 1n << 3n,
};

export const channelPermissions = {
  read: 1n << 0n,
  send: 1n << 1n,
};

export function checkPermission(rule: bigint, perms: bigint | string) {
  const p = typeof perms === 'string' ? BigInt(perms) : perms;
  return (rule & p) !== 0n;
}

export const Permissions = {
  space: spacePermissions,
  channel: channelPermissions,
  check: checkPermission,
};
