import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../MikotoClient';
import { MessageExt } from '../api.gen';
import { ZSchema } from '../helpers/ZSchema';
import { Manager } from './base';
import type { MikotoChannel } from './channel';

export class MikotoMessage extends ZSchema(MessageExt) {
  client!: MikotoClient;

  constructor(base: MessageExt, client: MikotoClient) {
    super(base);
    this.client = ref(client);
    return proxy(this);
  }

  _patch(data: MessageExt) {
    Object.assign(this, data);
  }

  get channel(): MikotoChannel {
    const channel = this.client.channels.cache.get(this.channelId);
    if (!channel) throw new Error('Channel not found');
    return channel;
  }

  get member() {
    if (!this.authorId) return undefined;
    return this.channel?.space?.members._get(this.authorId);
  }

  async edit(content: string) {
    if (this.channel.spaceId) {
      const message = await this.client.rest['messages.update'](
        { content },
        {
          params: {
            spaceId: this.channel.spaceId,
            channelId: this.channelId,
            messageId: this.id,
          },
        },
      );
      this._patch(message);
    } else {
      const message = await this.client.rest['dm.messages.update'](
        { content },
        {
          params: {
            channelId: this.channelId,
            messageId: this.id,
          },
        },
      );
      this._patch(message);
    }
  }

  async delete() {
    if (this.channel.spaceId) {
      await this.client.rest['messages.delete'](undefined, {
        params: {
          spaceId: this.channel.spaceId,
          channelId: this.channelId,
          messageId: this.id,
        },
      });
    } else {
      await this.client.rest['dm.messages.delete'](undefined, {
        params: {
          channelId: this.channelId,
          messageId: this.id,
        },
      });
    }
  }
}

export interface MessageListParams {
  limit?: number | null;
  cursor?: string | null;
}

export class MessageManager extends Manager {
  constructor(public channel: MikotoChannel) {
    super(channel.client);
    proxy(this);
  }

  async list({ limit, cursor }: MessageListParams) {
    if (this.channel.spaceId) {
      return this.client.rest['messages.list']({
        params: {
          spaceId: this.channel.spaceId,
          channelId: this.channel.id,
        },
        queries: { limit, cursor },
      });
    }
    return this.client.rest['dm.messages.list']({
      params: { channelId: this.channel.id },
      queries: { limit, cursor },
    });
  }
}
