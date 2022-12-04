import { DeltaEngine } from './DeltaEngine';
import type MikotoClient from '../index';
import { ClientSpace } from '../entities/ClientSpace';

export class SpaceEngine extends DeltaEngine<ClientSpace> {
  constructor(private client: MikotoClient) {
    super();
  }

  fetch(): Promise<ClientSpace[]> {
    return this.client.getSpaces();
  }
}
