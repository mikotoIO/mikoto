import type { MikotoClient } from '../MikotoClient';
import { ChannelInstance } from '../instances';
import { Channel } from '../models';
import type { ClientSpace } from './ClientSpace';

export class ClientChannel implements Channel {
  id: string;
  name: string;
  spaceId: string;
  // messages: MessageEngine;
  order: number;
  lastUpdated: string | null;
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
    // this.messages = new MessageEngine(client, this);
    this.instance = new ChannelInstance(client, this.id);
    this.space = space;
    client.channelWeakMap.set(this.id, this);
  }

  async getMessages(cursor?: string, limit = 50) {
    const data = await this.client.client.messages.list(this.id, {
      cursor: cursor ?? null,
      limit,
    });
    // return data.map((x) => new ClientMessage(this.client, x, this));
  }

  sendMessage(content: string) {
    return this.client.client.messages.send(this.id, content);
  }

  deleteMessage(messageId: string) {
    return this.client.client.messages.delete(this.id, messageId);
  }

  delete() {
    return this.client.client.channels.delete(this.id);
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
