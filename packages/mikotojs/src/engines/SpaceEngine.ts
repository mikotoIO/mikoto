import type { MikotoClient } from '../MikotoClient';
import { ClientSpace } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class SpaceEngine extends DeltaEngine<ClientSpace> {
  constructor(private client: MikotoClient) {
    super();
  }

  fetch(): Promise<ClientSpace[]> {
    return this.client.getSpaces();
  }
}
