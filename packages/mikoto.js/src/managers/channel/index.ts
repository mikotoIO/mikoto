import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../../MikotoClient';
import {
  Channel,
  type ChannelPatch,
  type Document,
  type DocumentPatch,
} from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';
import { MikotoMessage } from '../message';
import type { MikotoSpace } from '../space';

export class MikotoChannel extends ZSchema(Channel) {
  client!: MikotoClient;

  constructor(base: Channel, client: MikotoClient) {
    const cached = client.channels.cache.get(base.id);
    if (cached) {
      cached._patch(base);
      return cached;
    }

    super(base);
    this.client = ref(client);

    const instance = proxy(this);
    this.client.channels._insert(instance);
    return instance;
  }

  get space(): MikotoSpace | undefined {
    return this.client.spaces.cache.get(this.spaceId);
  }

  get lastUpdatedDate() {
    if (!this.lastUpdated) return undefined;
    return new Date(this.lastUpdated);
  }

  _patch(data: Channel) {
    Object.assign(this, data);
  }

  async edit(data: ChannelPatch) {
    const channel = await this.client.rest['channels.update'](data, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
    return this;
  }

  async delete() {
    await this.client.rest['channels.delete'](undefined, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
    this.client.channels.cache.delete(this.id);
  }

  async ack() {
    await this.client.rest['channels.acknowledge'](undefined, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }

  async listMessages(limit: number, cursor: string | null) {
    const msgs = await this.client.rest['messages.list']({
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
      queries: { limit, cursor },
    });
    return msgs.map((x) => new MikotoMessage(x, this.client));
  }

  async sendMessage(content: string) {
    await this.client.rest['messages.create'](
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

  async getDocument(): Promise<Document> {
    return await this.client.rest['documents.get']({
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }

  async updateDocument(patch: DocumentPatch): Promise<Document> {
    return await this.client.rest['documents.update'](patch, {
      params: {
        spaceId: this.spaceId,
        channelId: this.id,
      },
    });
  }
}

export class ChannelManager extends CachedManager<MikotoChannel> {
  constructor(client: MikotoClient) {
    super(client);
    return proxy(this);
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('channels.onCreate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      client.channels._insert(new MikotoChannel(data, client));
      space.channelIds.push(data.id);
    });

    client.ws.on('channels.onUpdate', (data) => {
      const channel = client.channels.cache.get(data.id);
      if (!channel) return;
      channel._patch(data);
    });

    client.ws.on('channels.onDelete', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.channelIds = space.channelIds.filter((x) => x !== data.id);
    });
  }
}
