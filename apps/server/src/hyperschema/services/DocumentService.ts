import { NotFoundError } from '@hyperschema/core';
import { z } from 'zod';

import { h } from '../core';
import { assertChannelMembership } from '../middlewares';
import { Document } from '../models';

export const DocumentService = h.service({
  get: h
    .fn({ channelId: z.string() }, Document)
    .use(assertChannelMembership)
    .do(async ({ $p, channelId }) => {
      const document = await $p.document.findUnique({
        where: { channelId },
      });
      if (document === null) throw new NotFoundError();
      return document;
    }),

  update: h
    .fn({ channelId: z.string(), content: z.string() }, Document)
    .use(assertChannelMembership)
    .do(async ({ $p, channelId, content }) => {
      const document = await $p.document.update({
        where: { channelId },
        data: { content },
      });
      return document;
    }),
});
