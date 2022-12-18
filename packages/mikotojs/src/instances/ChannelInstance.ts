import { DeltaInstance } from './DeltaInstance';
import type MikotoClient from '../index';
import { Channel } from '../models';

export class ChannelInstance extends DeltaInstance<Channel> {
  constructor(private mikoto: MikotoClient, private channelId: string) {
    super();
  }
  async fetch(): Promise<Channel> {
    return (await this.mikoto.getChannel(this.channelId)).simplify();
  }
}
