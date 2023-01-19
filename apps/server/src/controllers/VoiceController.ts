import { PrismaClient } from '@prisma/client';
import { AccessToken } from 'livekit-server-sdk';
import * as process from 'process';
import {
  CurrentUser,
  Get,
  JsonController,
  NotFoundError,
  Param,
} from 'routing-controllers';
import { Service } from 'typedi';

import { AccountJwt } from '../auth';

@JsonController()
@Service()
export class VoiceController {
  constructor(private prisma: PrismaClient) {}

  @Get('/voice/:channelId')
  async joinChannel(
    @CurrentUser() account: AccountJwt,
    @Param('channelId') channelId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: account.sub },
    });
    if (user === null) {
      throw new NotFoundError('User not found');
    }
    const token = new AccessToken('devkey', 'secret', {
      identity: account.sub,
      name: user.name,
    });
    token.addGrant({ roomJoin: true, room: channelId });
    return {
      url: process.env.LIVEKIT_SERVER,
      channelId,
      token: token.toJwt(),
    };
  }
}
