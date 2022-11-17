import type MikotoApi from '..';
import { ClientRole } from '../entities/ClientRole';
import { DeltaEngine } from './DeltaEngine';

export class RoleEngine extends DeltaEngine<ClientRole> {
  constructor(private client: MikotoApi, private spaceId: string) {
    super();
  }

  async fetch(): Promise<ClientRole[]> {
    return this.client.getRoles(this.spaceId);
  }
}
