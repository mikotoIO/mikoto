import { DeltaEngine } from './DeltaEngine';
import type MikotoClient from '../index';
import { ClientChannel } from '../entities/ClientChannel';
import { InfiniteCache } from '../cache';

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
