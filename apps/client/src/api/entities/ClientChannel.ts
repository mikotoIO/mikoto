import { Channel } from '../../models';
import { MessageEngine } from '../engines/MessageEngine';
import type { ClientSpace } from './ClientSpace';
import type MikotoApi from '../index';

export class ClientChannel implements Channel {
  id: string;
  name: string;
  spaceId: string;
  messages: MessageEngine;
  order: number;

  constructor(private client: MikotoApi, base: Channel) {
    this.id = base.id;
    this.name = base.name;
    this.spaceId = base.spaceId;
    this.order = base.order;
    this.messages = new MessageEngine(client, this.id);
  }

  get space(): ClientSpace {
    return this.client.spaceCache.get(this.spaceId)!;
  }

  simplify(): Channel {
    return {
      id: this.id,
      name: this.name,
      order: this.order,
      spaceId: this.spaceId,
    };
  }
}
