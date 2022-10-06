import { CurrentUser, Get, JsonController } from 'routing-controllers';
import { Service } from 'typedi';
import { AccessToken } from 'livekit-server-sdk';
import * as process from 'process';
import { AccountJwt } from '../auth';

@JsonController()
@Service()
export class VoiceController {
  @Get('/voice')
  joinChannel(@CurrentUser() account: AccountJwt) {
    const token = new AccessToken('devkey', 'secret', {
      identity: account.sub,
    });
    token.addGrant({ roomJoin: true });
    return {
      url: process.env.LIVEKIT_SERVER,
      token: token.toJwt(),
    };
  }
}
