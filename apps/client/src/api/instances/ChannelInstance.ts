import { DeltaInstance } from './DeltaInstance';
import type MikotoApi from '../index';
import { Channel } from '../../models';

export class ChannelInstance extends DeltaInstance<Channel> {
  constructor(private mikoto: MikotoApi, private channelId: string) {
    super();
  }
  async fetch(): Promise<Channel> {
    return (await this.mikoto.getChannel(this.channelId)).simplify();
  }
}
