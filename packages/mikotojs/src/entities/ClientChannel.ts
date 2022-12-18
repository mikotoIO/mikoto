import { MessageEngine } from '../engines';
import type MikotoClient from '../index';
import { ChannelInstance } from '../instances';
import { Channel } from '../models';
import { ClientMessage } from './ClientMessage';
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
    this.messages = new MessageEngine(client, this);
    this.instance = new ChannelInstance(client, this.id);
    this.space = space;

    client.channelWeakMap.set(this.id, this);
  }

  async getMessages() {
    const data = await this.client.api.getMessages(this.id);
    return data.map((x) => new ClientMessage(this.client, x, this));
  }

  sendMessage(content: string) {
    return this.client.api.sendMessage(this.id, content);
  }

  deleteMessage(messageId: string) {
    return this.client.api.deleteMessage(this.id, messageId);
  }

  delete() {
    return this.client.api.deleteChannel(this.id);
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
