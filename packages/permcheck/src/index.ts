/* eslint-disable no-bitwise */
export const permissions = {
  superuser: 1n << 0n,
  // Management permissions
  manageSpace: 1n << 1n,
  manageChannels: 1n << 2n,
  manageRoles: 1n << 3n,
  manageMemberRoles: 1n << 4n,
  manageMemberProfiles: 1n << 5n,
  manageInvites: 1n << 6n,
  manageMessages: 1n << 7n,
  ban: 1n << 8n,

  // channelwise permissions
  readChannel: 1n << 9n,
  sendInChannel: 1n << 10n,
  createSubChannels: 1n << 11n,
  manageSubChannels: 1n << 12n,
};

export function checkPermission(rule: bigint, perms: bigint | string) {
  const p = typeof perms === 'string' ? BigInt(perms) : perms;
  return (rule & p) !== 0n;
}
