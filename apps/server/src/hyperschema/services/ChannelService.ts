import { permissions } from '@mikoto-io/permcheck';
import { ChannelType } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '../../functions/prisma';
import { h } from '../core';
import {
  assertChannelMembership,
  assertSpaceMembership,
  enforceSpacePerm,
} from '../middlewares';
import { Channel, ChannelUpdateOptions } from '../models';

export const ChannelService = h.service({
  get: h
    .fn({ channelId: z.string() }, Channel)
    .use(assertChannelMembership)
    .do(async ({ channel }) => {
      return channel;
    }),

  list: h
    .fn({ spaceId: z.string() }, Channel.array())
    .use(assertSpaceMembership)
    .do(async ({ spaceId }) => {
      const channels = await prisma.channel.findMany({ where: { spaceId } });
      return channels;
    }),

  create: h
    .fn(
      {
        spaceId: z.string(),
        name: z.string(),
        parentId: z.string().nullable(),
        type: z.string(),
      },
      Channel,
    )
    .use(enforceSpacePerm(permissions.manageChannels))
    .do(async ({ $r, spaceId, name, type, parentId }) => {
      const channel = await prisma.channel.create({
        data: {
          name,
          spaceId,
          parentId,
          type: type as ChannelType,
          order: 0,
          Document:
            type === 'DOCUMENT'
              ? {
                  create: {
                    content: '',
                  },
                }
              : undefined,
        },
      });
      await $r.pub(`space:${spaceId}`, 'createChannel', channel);
      return channel;
    }),

  update: h
    .fn(
      {
        channelId: z.string(),
        options: ChannelUpdateOptions,
      },
      Channel,
    )
    .use(assertChannelMembership)
    .use(enforceSpacePerm(permissions.manageChannels))
    .do(async ({ channelId, options, $r }) => {
      const channel = await prisma.channel.update({
        where: { id: channelId },
        data: {
          name: options.name ?? undefined,
        },
      });
      await $r.pub(`space:${channel.spaceId}`, 'updateChannel', channel);
      return channel;
    }),

  delete: h
    .fn({ channelId: z.string() }, Channel)
    .use(assertChannelMembership)
    .use(enforceSpacePerm(permissions.manageChannels))
    .do(async ({ channel, $r }) => {
      await prisma.channel.delete({ where: { id: channel.id } });
      await $r.pub(`space:${channel.spaceId}`, 'deleteChannel', channel);
      return channel;
    }),

  onCreate: h.event(Channel).emitter((emit, { $r }) => {
    $r.on('createChannel', emit);
  }),

  onUpdate: h.event(Channel).emitter((emit, { $r }) => {
    $r.on('updateChannel', emit);
  }),

  onDelete: h.event(Channel).emitter((emit, { $r }) => {
    $r.on('deleteChannel', emit);
  }),
});
