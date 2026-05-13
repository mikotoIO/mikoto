import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../MikotoClient';
import { MessageExt } from '../api.gen';
import { ZSchema } from '../helpers/ZSchema';
import { Manager } from './base';
import type { MikotoChannel } from './channel';

export class MikotoMessage extends ZSchema(MessageExt) {
  client!: MikotoClient;
  pending?: boolean;

  constructor(base: MessageExt, client: MikotoClient, pending?: boolean) {
    super(base);
    this.client = ref(client);
    if (pending) this.pending = true;
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
    const members = this.channel?.space?.members;
    if (!members) return undefined;
    const cached = members._get(this.authorId);
    if (cached) return cached;
    // Lazy-load the member on first access. The valtio proxy will trigger
    // a re-render once the cache is populated. Internal dedup prevents
    // duplicate requests for the same user.
    members.ensureLoaded(this.authorId);
    return undefined;
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

  /**
   * Add a reaction to this message. Reactions in DMs are not currently
   * supported on the server.
   */
  async addReaction(emoji: string) {
    if (!this.channel.spaceId) return;
    await this.client.rest['messages.reactions.add'](
      { emoji },
      {
        params: {
          spaceId: this.channel.spaceId,
          channelId: this.channelId,
          messageId: this.id,
        },
      },
    );
  }

  async removeReaction(emoji: string) {
    if (!this.channel.spaceId) return;
    await this.client.rest['messages.reactions.remove'](
      { emoji },
      {
        params: {
          spaceId: this.channel.spaceId,
          channelId: this.channelId,
          messageId: this.id,
        },
      },
    );
  }

  /**
   * Toggle a reaction by the current user.
   */
  async toggleReaction(emoji: string) {
    const me = this.client.user.me?.id;
    if (!me) return;
    const existing = this.reactions.find((r) => r.emoji === emoji);
    if (existing && existing.userIds.includes(me)) {
      await this.removeReaction(emoji);
    } else {
      await this.addReaction(emoji);
    }
  }

  _applyReactionAdd(emoji: string, userId: string) {
    const group = this.reactions.find((r) => r.emoji === emoji);
    if (group) {
      if (!group.userIds.includes(userId)) {
        group.userIds.push(userId);
        group.count = group.userIds.length;
      }
    } else {
      this.reactions.push({ emoji, count: 1, userIds: [userId] });
    }
  }

  _applyReactionRemove(emoji: string, userId: string) {
    const idx = this.reactions.findIndex((r) => r.emoji === emoji);
    if (idx === -1) return;
    const group = this.reactions[idx];
    const userIdx = group.userIds.indexOf(userId);
    if (userIdx !== -1) group.userIds.splice(userIdx, 1);
    group.count = group.userIds.length;
    if (group.count === 0) {
      this.reactions.splice(idx, 1);
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
