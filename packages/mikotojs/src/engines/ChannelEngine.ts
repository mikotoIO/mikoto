import type { MikotoClient } from '../MikotoClient';
import { InfiniteCache } from '../cache';
import { ClientChannel } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class ChannelEngine extends DeltaEngine<ClientChannel> {
  cache = new InfiniteCache<ClientChannel>();
  constructor(
    private client: MikotoClient,
    private spaceId: string,
    channels: ClientChannel[] = [],
  ) {
    super();
    channels.forEach((x) => this.cache.set(x));
  }

  async fetch(): Promise<ClientChannel[]> {
    return [...this.cache.toMap().values()];
  }
}
