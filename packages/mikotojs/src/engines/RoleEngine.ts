import type { MikotoClient } from '../MikotoClient';
import { InfiniteCache } from '../cache';
import { ClientRole } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class RoleEngine extends DeltaEngine<ClientRole> {
  cache = new InfiniteCache<ClientRole>();

  constructor(
    private client: MikotoClient,
    private spaceId: string,
    roles: ClientRole[],
  ) {
    super();
    roles.forEach((x) => this.cache.set(x));
  }

  async fetch(): Promise<ClientRole[]> {
    return this.client.getRoles(this.spaceId);
  }

  override get(id: string): ClientRole | undefined {
    return this.cache.get(id);
  }

  list(): ClientRole[] {
    return Array.from(this.cache.toMap().values());
  }
}
