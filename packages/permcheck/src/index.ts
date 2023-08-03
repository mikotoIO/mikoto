/* eslint-disable no-bitwise */
export const permissions = {
  superuser: 1n << 0n,
  manageSpace: 1n << 1n,
  manageChannels: 1n << 2n,
  manageRoles: 1n << 3n,
};

export function checkPermission(rule: bigint, perms: bigint | string) {
  const p = typeof perms === 'string' ? BigInt(perms) : perms;
  return (rule & p) !== 0n;
}
