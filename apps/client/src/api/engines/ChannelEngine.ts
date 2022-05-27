import { DeltaEngine } from '../deltaEngine';
import type MikotoApi from '../index';
import type { ClientChannel } from '../index';

export class ChannelEngine extends DeltaEngine<ClientChannel> {
  constructor(private client: MikotoApi, private spaceId: string) {
    super();
  }

  async fetch(): Promise<ClientChannel[]> {
    return this.client.getChannels(this.spaceId);
  }
}
