import { Space } from '../../models';
import type MikotoApi from '../index';
import { ChannelEngine } from '../engines/ChannelEngine';
import { ChannelUnreadInstance } from '../instances/ChannelUnreadInstance';

export class ClientSpace implements Space {
  id: string;
  name: string;
  channels: ChannelEngine;
  unreads: ChannelUnreadInstance;

  constructor(private client: MikotoApi, base: Space) {
    this.id = base.id;
    this.name = base.name;
    this.channels = new ChannelEngine(client, this.id);
    this.unreads = new ChannelUnreadInstance(client, this.id);
  }

  simplify(): Space {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
