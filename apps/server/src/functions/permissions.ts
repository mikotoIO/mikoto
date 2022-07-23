/* eslint-disable no-bitwise */
export const spacePermissions = {
  superuser: 1n << 0n,
};

export const channelPermissions = {
  read: 1n << 0n,
  send: 1n << 1n,
};

export function checkPermission(rule: bigint, perms: bigint | string) {
  const p = typeof perms === 'string' ? BigInt(perms) : perms;
  return (rule & p) !== 0n;
}
