import { permissions } from '@mikoto-io/permcheck';
import { ChannelType } from '@prisma/client';
import { z } from 'zod';

import { h } from '../core';
import {
  assertChannelMembership,
  assertSpaceMembership,
  requireSpacePerm,
} from '../middlewares';
import { Channel, ChannelCreateOptions, ChannelUpdateOptions } from '../models';

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
    .do(async ({ $p, spaceId }) => {
      const channels = await $p.channel.findMany({ where: { spaceId } });
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
    .use(requireSpacePerm(permissions.manageChannels))
    .do(async ({ $p, $r, spaceId, name, type, parentId }) => {
      const channel = await $p.channel.create({
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
    .do(async ({ channelId, options, $p, $r }) => {
      // FIXME: proper permissions
      const channel = await $p.channel.update({
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
    .do(async ({ channel, $p, $r }) => {
      await $p.channel.delete({ where: { id: channel.id } });
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
