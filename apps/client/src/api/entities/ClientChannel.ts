import { Channel } from '../../models';
import { MessageEngine } from '../engines/MessageEngine';
import type MikotoApi from '../index';
import { ChannelInstance } from '../instances/ChannelInstance';

export class ClientChannel implements Channel {
  id: string;
  name: string;
  spaceId: string;
  messages: MessageEngine;
  order: number;
  lastUpdated: string;
  type: string;
  instance: ChannelInstance;

  constructor(private client: MikotoApi, base: Channel) {
    this.id = base.id;
    this.name = base.name;
    this.spaceId = base.spaceId;
    this.order = base.order;
    this.lastUpdated = base.lastUpdated;
    this.type = base.type;
    this.messages = new MessageEngine(client, this.id);
    this.instance = new ChannelInstance(client, this.id);
  }

  simplify(): Channel {
    return {
      id: this.id,
      name: this.name,
      order: this.order,
      spaceId: this.spaceId,
      lastUpdated: this.lastUpdated,
      type: this.type,
    };
  }
}
