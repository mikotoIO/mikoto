import type MikotoApi from '..';
import { ClientRole } from '../entities/ClientRole';
import { DeltaEngine } from './DeltaEngine';
import { InfiniteCache } from '../cache';

export class RoleEngine extends DeltaEngine<ClientRole> {
  cache = new InfiniteCache<ClientRole>();

  constructor(private client: MikotoApi, private spaceId: string) {
    super();
  }

  async fetch(): Promise<ClientRole[]> {
    return this.client.getRoles(this.spaceId);
  }
}
