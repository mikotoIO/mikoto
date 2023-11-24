/* eslint-disable no-bitwise */
export const permissions = {
  superuser: 1n << 0n,
  // Management permissions
  manageSpace: 1n << 1n,
  manageChannels: 1n << 2n,
  manageRoles: 1n << 3n,
  assignRoles: 1n << 4n,
  manageMemberProfiles: 1n << 5n,
  manageInvites: 1n << 6n,
  manageEmojis: 1n << 7n,
  manageMessages: 1n << 8n,
  manageBots: 1n << 9n,
  ban: 1n << 10n,

  // channelwise permissions
  readChannel: 1n << 11n,
  sendInChannel: 1n << 12n,
  createSubChannels: 1n << 13n,
  manageSubChannels: 1n << 14n,
};

/**
 * Check if a permission is set in a permission set
 * @param rule The permission to check against
 * @param perms The total permission bitset of the user
 * @returns True if the user is authorized
 */
export function checkPermission(rule: bigint, perms: bigint | string) {
  const p = typeof perms === 'string' ? BigInt(perms) : perms;
  return (rule & p) !== 0n;
}
