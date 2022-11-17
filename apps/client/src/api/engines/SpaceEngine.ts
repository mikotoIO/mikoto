import { DeltaEngine } from './DeltaEngine';
import type MikotoApi from '../index';
import { ClientSpace } from '../entities/ClientSpace';

export class SpaceEngine extends DeltaEngine<ClientSpace> {
  constructor(private client: MikotoApi) {
    super();
  }

  fetch(): Promise<ClientSpace[]> {
    return this.client.getSpaces();
  }
}
