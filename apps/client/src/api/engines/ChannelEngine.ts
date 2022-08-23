import { DeltaEngine } from './DeltaEngine';
import type MikotoApi from '../index';
import { ClientChannel } from '../entities/ClientChannel';

export class ChannelEngine extends DeltaEngine<ClientChannel> {
  constructor(private client: MikotoApi, private spaceId: string) {
    super();
  }

  async fetch(): Promise<ClientChannel[]> {
    return this.client.getChannels(this.spaceId);
  }
}
