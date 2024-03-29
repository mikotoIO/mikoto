import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Channel, ChannelUpdateOptions } from '../hs-client';
import { Store } from './base';
import { ClientMessage } from './message';

export class ClientChannel implements Channel {
  id!: string;
  name!: string;
  spaceId!: string;
  parentId!: string | null;
  type!: string;
  order!: number;
  lastUpdated!: string | null;

  get space() {
    return this.client.spaces.get(this.spaceId);
  }

  get lastUpdatedDate() {
    return this.lastUpdated ? new Date(this.lastUpdated) : null;
  }

  async listMessages(limit: number, cursor: string | null) {
    const msgs = await this.client.client.messages.list({
      channelId: this.id,
      limit,
      cursor,
    });
    // return msgs;
    return msgs.map((x) => new ClientMessage(this.client, x));
  }

  constructor(
    public client: MikotoClient,
    data: Channel,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }

  async update(options: ChannelUpdateOptions) {
    await this.client.client.channels.update({
      channelId: this.id,
      options,
    });
  }

  async delete() {
    await this.client.client.channels.delete({ channelId: this.id });
  }

  async sendMessage(content: string) {
    await this.client.client.messages.send({
      channelId: this.id,
      content,
    });
  }
}

export class ChannelStore extends Store<Channel, ClientChannel> {
  async fetch(id: string, data?: Channel) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData =
      data ?? (await this.client.client.channels.get({ channelId: id }));
    return this.produce(cData);
  }

  foreignCreate(data: Channel) {
    this.client.spaces.get(data.spaceId)?.channelIds?.push?.(data.id);
  }

  foreignDelete(data: Channel) {
    const space = this.client.spaces.get(data.spaceId);
    if (!space) return;
    space.channelIds = space.channelIds.filter((x) => x !== data.id);
  }
}
