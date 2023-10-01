import { NotFoundError } from '@hyperschema/core';
import { AccessToken } from 'livekit-server-sdk';
import { z } from 'zod';

import { env } from '../../env';
import { h } from '../core';
import { VoiceToken } from '../models';

export const VoiceService = h.service({
  join: h
    .fn({ channelId: z.string() }, VoiceToken)
    .do(async ({ $p, channelId, state }) => {
      const user = await $p.user.findUnique({
        where: { id: state.user.id },
      });
      if (user === null) {
        throw new NotFoundError('User not found');
      }
      const token = new AccessToken(env.LIVEKIT_KEY, env.LIVEKIT_SECRET, {
        identity: state.user.id,
        name: user.name,
      });
      token.addGrant({ roomJoin: true, room: channelId });
      return {
        url: env.LIVEKIT_SERVER,
        channelId,
        token: token.toJwt(),
      };
    }),
});
