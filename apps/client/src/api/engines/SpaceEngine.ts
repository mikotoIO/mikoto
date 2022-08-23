import { DeltaEngine } from './DeltaEngine';
import { Space } from '../../models';
import type MikotoApi from '../index';

export class SpaceEngine extends DeltaEngine<Space> {
  constructor(private client: MikotoApi) {
    super();
  }

  fetch(): Promise<Space[]> {
    return this.client.getSpaces();
  }
}
