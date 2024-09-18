import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Channel, ChannelPatch, ChannelType } from '../api.gen';
import { Store } from './base';
import { ClientMessage } from './message';

export class ClientChannel implements Channel {
  id!: string;
  name!: string;
  spaceId!: string;
  parentId!: string | null | undefined;
  type!: ChannelType;
  order!: number;
  lastUpdated!: string | null | undefined;

  get space() {
    return this.client.spaces.get(this.spaceId);
  }

  get lastUpdatedDate() {
    return this.lastUpdated ? new Date(this.lastUpdated) : null;
  }

  async listMessages(limit: number, cursor: string | null) {
    const msgs = await this.client.api['messages.list']({
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
      queries: { limit, cursor },
    });
    return msgs.map((x) => new ClientMessage(this.client, x));
  }

  constructor(
    public client: MikotoClient,
    data: Channel,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }

  async update(options: ChannelPatch) {
    await this.client.api['channels.update'](options, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }

  async delete() {
    await this.client.api['channels.delete'](undefined, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }

  async sendMessage(content: string) {
    await this.client.api['messages.create'](
      {
        content,
      },
      {
        params: {
          spaceId: this.spaceId,
          channelId: this.id,
        },
      },
    );
  }

  async ack() {
    await this.client.api['channels.acknowledge'](undefined, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }
}

export class ChannelStore extends Store<Channel, ClientChannel> {
  async fetch(spaceId: string, channelId: string, data?: Channel) {
    if (this.has(channelId)) return this.getAndUpdate(channelId, data);
    const cData =
      data ??
      (await this.client.api['channels.get']({
        params: { spaceId, channelId },
      }));
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
