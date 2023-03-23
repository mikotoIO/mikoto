import { AccessToken } from 'livekit-server-sdk';
import process from 'process';
import { NotFoundError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import { VoiceService } from './schema';
import { sophon } from './sophon';

export const voiceService = sophon.create(VoiceService, {
  async join(ctx, id: string) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.data.user.sub },
    });
    if (user === null) {
      throw new NotFoundError('User not found');
    }
    const token = new AccessToken('devkey', 'secret', {
      identity: ctx.data.user.sub,
      name: user.name,
    });
    token.addGrant({ roomJoin: true, room: id });
    return {
      url: process.env.LIVEKIT_SERVER!,
      channelId: id,
      token: token.toJwt(),
    };
  },
});
