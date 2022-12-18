import type { MikotoClient } from '../MikotoClient';
import { Channel } from '../models';
import { DeltaInstance } from './DeltaInstance';

export class ChannelInstance extends DeltaInstance<Channel> {
  constructor(private mikoto: MikotoClient, private channelId: string) {
    super();
  }
  async fetch(): Promise<Channel> {
    return (await this.mikoto.getChannel(this.channelId)).simplify();
  }
}
