export declare const permissions: {
    superuser: bigint;
    manageSpace: bigint;
    manageChannels: bigint;
    manageRoles: bigint;
    assignRoles: bigint;
    manageMemberProfiles: bigint;
    manageInvites: bigint;
    manageEmojis: bigint;
    manageMessages: bigint;
    manageBots: bigint;
    ban: bigint;
    readChannel: bigint;
    sendInChannel: bigint;
    createSubChannels: bigint;
    manageSubChannels: bigint;
};
/**
 * Check if a permission is set in a permission set
 * @param rule The permission to check against. Usually has only one bit set.
 * @param perms The total permission bitset of the user
 * @returns True if the user is authorized
 */
export declare function checkPermission(rule: bigint, perms: bigint | string): boolean;
