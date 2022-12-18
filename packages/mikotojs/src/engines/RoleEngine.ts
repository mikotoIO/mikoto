import type { MikotoClient } from '../MikotoClient';
import { InfiniteCache } from '../cache';
import { ClientRole } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class RoleEngine extends DeltaEngine<ClientRole> {
  cache = new InfiniteCache<ClientRole>();

  constructor(private client: MikotoClient, private spaceId: string) {
    super();
  }

  async fetch(): Promise<ClientRole[]> {
    return this.client.getRoles(this.spaceId);
  }
}
