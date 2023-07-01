import { SophonInstance } from '@sophon-js/server';
import { AccessToken } from 'livekit-server-sdk';
import { NotFoundError } from 'routing-controllers';

import { env } from '../env';
import { prisma } from '../functions/prisma';
import { AbstractVoiceService } from './schema';

export class VoiceService extends AbstractVoiceService {
  async join(ctx: SophonInstance, id: string) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.data.user.sub },
    });
    if (user === null) {
      throw new NotFoundError('User not found');
    }
    const token = new AccessToken(env.LIVEKIT_KEY, env.LIVEKIT_SECRET, {
      identity: ctx.data.user.sub,
      name: user.name,
    });
    token.addGrant({ roomJoin: true, room: id });
    return {
      url: env.LIVEKIT_SERVER,
      channelId: id,
      token: token.toJwt(),
    };
  }
}
