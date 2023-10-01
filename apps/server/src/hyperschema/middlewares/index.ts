import { NotFoundError, UnauthorizedError } from '@hyperschema/core';
import { checkPermission, permissions } from '@mikoto-io/permcheck';
import { Channel } from '@prisma/client';

import { HSContext } from '../core';

export async function assertSpaceMembership<
  T extends HSContext & { spaceId: string },
>(props: T): Promise<T> {
  const membership = await props.$p.spaceUser.findUnique({
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
>(props: T): Promise<T & { channel: Channel }> {
  const channel = await props.$p.channel.findUnique({
    where: { id: props.channelId },
  });
  if (channel === null) throw new NotFoundError('Channel not found');
  const membership = await props.$p.spaceUser.findUnique({
    where: {
      userId_spaceId: {
        userId: props.state.user.id,
        spaceId: channel.spaceId,
      },
    },
  });

  if (membership === null)
    throw new UnauthorizedError('Not a member of channel');
  return { ...props, channel };
}

export function requireSpacePerm<T extends HSContext & { spaceId: string }>(
  rule: bigint,
  superuserOverride = true,
) {
  return async (props: T): Promise<T> => {
    let r = typeof rule === 'string' ? BigInt(rule) : rule;

    const spc = await props.$p.space.findUnique({
      where: { id: props.spaceId },
    });
    if (spc === null) throw new NotFoundError('Space not found');
    if (spc.ownerId === props.state.user.id) return props;
    const member = await props.$p.spaceUser.findUnique({
      where: {
        userId_spaceId: { userId: props.state.user.id, spaceId: props.spaceId },
      },
      include: { roles: true },
    });
    if (member === null) throw new NotFoundError('Not a member of space');

    const totalPerms = member.roles.reduce(
      (acc, x) => acc | BigInt(x.permissions),
      0n,
    );

    if (superuserOverride) {
      r |= permissions.superuser;
    }
    const res = checkPermission(r, totalPerms);
    if (!res) throw new UnauthorizedError('Insufficient permissions');

    return props;
  };
}
