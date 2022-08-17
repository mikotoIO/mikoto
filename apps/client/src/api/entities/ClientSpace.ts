import { Space } from '../../models';
import { ChannelEngine } from '../engines/ChannelEngine';
import type MikotoApi from '../index';

export class ClientSpace implements Space {
  id: string;
  name: string;
  channels: ChannelEngine;

  constructor(private client: MikotoApi, base: Space) {
    this.id = base.id;
    this.name = base.name;
    this.channels = new ChannelEngine(client, this.id);
  }

  simplify(): Space {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
