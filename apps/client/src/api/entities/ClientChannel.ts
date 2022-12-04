import { Channel } from '../../models';
import { MessageEngine } from '../engines/MessageEngine';
import type MikotoClient from '../index';
import { ChannelInstance } from '../instances/ChannelInstance';
import type { ClientSpace } from './ClientSpace';

export class ClientChannel implements Channel {
  id: string;
  name: string;
  spaceId: string;
  messages: MessageEngine;
  order: number;
  lastUpdated: string;
  type: string;
  instance: ChannelInstance;
  space: ClientSpace;

  constructor(private client: MikotoClient, base: Channel, space: ClientSpace) {
    this.id = base.id;
    this.name = base.name;
    this.spaceId = base.spaceId;
    this.order = base.order;
    this.lastUpdated = base.lastUpdated;
    this.type = base.type;
    this.messages = new MessageEngine(client, this.id);
    this.instance = new ChannelInstance(client, this.id);
    this.space = space;
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
