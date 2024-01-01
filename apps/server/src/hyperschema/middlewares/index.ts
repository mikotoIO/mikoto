import { NotFoundError, UnauthorizedError } from '@hyperschema/core';
import { checkPermission, permissions } from '@mikoto-io/permcheck';
import { Channel, SpaceUser } from '@prisma/client';

import { logger } from '../../functions/logger';
import { prisma } from '../../functions/prisma';
import { HSContext } from '../core';
import { spaceInclude } from '../normalizer';

export async function assertSpaceMembership<
  T extends HSContext & { spaceId: string },
>(props: T): Promise<T> {
  const membership = await prisma.spaceUser.findUnique({
    where: {
      userId_spaceId: {
        userId: props.state.user.id,
        spaceId: props.spaceId,
      },
    },
  });
  if (membership === null) throw new UnauthorizedError('Not a member of space');
  return props;
}

interface EnforceChannelMembershipOutput {
  channel: Channel;
  spaceId: string;
  member: SpaceUser;
}

export async function assertChannelMembership<
  T extends HSContext & { channelId: string },
>(props: T): Promise<T & EnforceChannelMembershipOutput> {
  const channel = await prisma.channel.findUnique({
    where: { id: props.channelId },
  });
  if (channel === null) throw new NotFoundError('Channel not found');
  const membership = await prisma.spaceUser.findUnique({
    where: {
      userId_spaceId: {
        userId: props.state.user.id,
        spaceId: channel.spaceId,
      },
    },
  });

  if (membership === null)
    throw new UnauthorizedError('Not a member of channel');
  return { ...props, channel, spaceId: channel.spaceId, member: membership };
}

/**
 *
 * @param memberRoles The role of the member
 * @param defaultRole The default role of the space
 * @param rule a bitset representing the rule to enforce.
 * @param superuserOverride
 */
function assertSpacePermission(
  memberRoles: { permissions: string }[],
  defaultRole: { permissions: string } | undefined,
  rule: bigint,
  superuserOverride: boolean,
) {
  let r = typeof rule === 'string' ? BigInt(rule) : rule;

  // apply all roles into a single permission set
  const totalPerms =
    memberRoles.reduce((acc, x) => acc | BigInt(x.permissions), 0n) |
    BigInt(defaultRole?.permissions ?? 0n); // apply @everyone role

  // FIXME: Is this correct? I am not exactly sure because of the complex implementation of permcheck
  if (superuserOverride) {
    r |= permissions.superuser;
  }
  const res = checkPermission(r, totalPerms);

  if (!res) {
    logger.warn(`Permission engine: expected ${r}, got ${totalPerms}`);
    throw new UnauthorizedError('Insufficient permissions');
  }
}

/**
 * Guard for enforcing space permissions. requires a spaceId in the input.
 * @param rule
 * @param superuserOverride
 * @returns
 */
export function enforceSpacePerm<T extends HSContext & { spaceId: string }>(
  rule: bigint,
  superuserOverride = true,
) {
  return async (props: T): Promise<T> => {
    const space = await prisma.space.findUnique({
      where: { id: props.spaceId },
      include: spaceInclude,
    });
    if (space === null) throw new NotFoundError('Space not found');
    if (space.ownerId === props.state.user.id) return { ...props, space };
    const member = await prisma.spaceUser.findUnique({
      where: {
        userId_spaceId: { userId: props.state.user.id, spaceId: props.spaceId },
      },
      include: { roles: true },
    });
    if (member === null) throw new NotFoundError('Not a member of space');

    // actual permission checking
    assertSpacePermission(
      member.roles,
      space.roles.at(-1),
      rule,
      superuserOverride,
    );
    return { ...props, space };
  };
}
