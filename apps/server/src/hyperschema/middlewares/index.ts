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

export async function assertChannelMembership<
  T extends HSContext & { channelId: string },
>(props: T): Promise<T & { channel: Channel; member: SpaceUser }> {
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
  return { ...props, channel, member: membership };
}

export function requireSpacePerm<T extends HSContext & { spaceId: string }>(
  rule: bigint,
  superuserOverride = true,
) {
  return async (props: T): Promise<T> => {
    let r = typeof rule === 'string' ? BigInt(rule) : rule;

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
    const totalPerms =
      member.roles.reduce((acc, x) => acc | BigInt(x.permissions), 0n) |
      BigInt(space.roles.at(-1)?.permissions ?? 0n);

    if (superuserOverride) {
      r |= permissions.superuser;
    }
    const res = checkPermission(r, totalPerms);
    if (!res) {
      logger.warn(`Permission engine: expected ${r}, got ${totalPerms}`);
      throw new UnauthorizedError('Insufficient permissions');
    }

    return { ...props, space };
  };
}
