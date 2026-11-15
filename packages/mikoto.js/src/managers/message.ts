import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../MikotoClient';
import { MessageExt, type ReactionEvent } from '../api.gen';
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

  /**
   * Apply one user's reaction being added or removed. Idempotent, so an
   * optimistic local change and the server's event for it agree.
   */
  _applyReaction(
    event: Pick<ReactionEvent, 'userId' | 'emoji' | 'emojiId'>,
    added: boolean,
  ) {
    const index = this.reactions.findIndex((r) => r.emoji === event.emoji);
    const reaction = index === -1 ? undefined : this.reactions[index];
    if (added) {
      if (!reaction) {
        this.reactions.push({
          emoji: event.emoji,
          emojiId: event.emojiId ?? null,
          count: 1,
          userIds: [event.userId],
        });
      } else if (!reaction.userIds.includes(event.userId)) {
        reaction.userIds.push(event.userId);
        reaction.count += 1;
      }
      return;
    }
    if (!reaction || !reaction.userIds.includes(event.userId)) return;
    reaction.userIds = reaction.userIds.filter((id) => id !== event.userId);
    reaction.count -= 1;
    if (reaction.count <= 0) this.reactions.splice(index, 1);
  }

  /** Whether the signed-in user has reacted with `emoji`. */
  hasReacted(emoji: string) {
    const me = this.client.user.me?.id;
    if (!me) return false;
    return !!this.reactions
      .find((r) => r.emoji === emoji)
      ?.userIds.includes(me);
  }

  /**
   * React with `emoji`: a standard emoji shortcode (`+1`) or the id of a
   * custom emoji in this message's space. Shows immediately; rolls back if
   * the server refuses.
   */
  async react(emoji: string, emojiId: string | null = null) {
    await this.setReaction(emoji, emojiId, true);
  }

  async unreact(emoji: string) {
    const emojiId =
      this.reactions.find((r) => r.emoji === emoji)?.emojiId ?? null;
    await this.setReaction(emoji, emojiId, false);
  }

  /** Add the reaction if the signed-in user hasn't reacted, else remove it. */
  async toggleReaction(emoji: string, emojiId: string | null = null) {
    if (this.hasReacted(emoji)) await this.unreact(emoji);
    else await this.react(emoji, emojiId);
  }

  private async setReaction(
    emoji: string,
    emojiId: string | null,
    add: boolean,
  ) {
    const userId = this.client.user.me?.id;
    const change = userId ? { userId, emoji, emojiId } : null;
    if (change) this._applyReaction(change, add);
    try {
      const spaceId = this.channel.spaceId;
      if (spaceId) {
        const params = {
          spaceId,
          channelId: this.channelId,
          messageId: this.id,
          emoji,
        };
        if (add) {
          await this.client.rest['messages.addReaction'](undefined, {
            params,
          });
        } else {
          await this.client.rest['messages.removeReaction'](undefined, {
            params,
          });
        }
      } else {
        const params = { channelId: this.channelId, messageId: this.id, emoji };
        if (add) {
          await this.client.rest['dm.messages.addReaction'](undefined, {
            params,
          });
        } else {
          await this.client.rest['dm.messages.removeReaction'](undefined, {
            params,
          });
        }
      }
    } catch (err) {
      if (change) this._applyReaction(change, !add);
      throw err;
    }
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
