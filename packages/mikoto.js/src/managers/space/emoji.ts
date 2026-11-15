import { proxy, ref } from 'valtio/vanilla';

import type { MikotoSpace } from '.';
import type { MikotoClient } from '../../MikotoClient';
import { Emoji, type EmojiCreatePayload } from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';

/** A space's custom emoji. Members write it as `:name:`. */
export class MikotoEmoji extends ZSchema(Emoji) {
  client!: MikotoClient;

  constructor(base: Emoji, client: MikotoClient) {
    super(base);
    this.client = ref(client);
    return proxy(this);
  }

  _patch(data: Emoji) {
    Object.assign(this, data);
  }

  async rename(name: string) {
    const emoji = await this.client.rest['emojis.update'](
      { name },
      { params: { spaceId: this.spaceId, emojiId: this.id } },
    );
    this._patch(emoji);
  }

  async delete() {
    await this.client.rest['emojis.delete'](undefined, {
      params: { spaceId: this.spaceId, emojiId: this.id },
    });
  }
}

export class EmojiManager extends CachedManager<MikotoEmoji> {
  constructor(
    public space: MikotoSpace,
    emojis: Emoji[],
  ) {
    super(space.client);
    this._replace(emojis);
    return proxy(this);
  }

  _replace(emojis: Emoji[]) {
    this.cache.clear();
    for (const emoji of emojis) {
      this._insert(new MikotoEmoji(emoji, this.client));
    }
  }

  /** The emoji called `name` (case-insensitive), as `:name:` resolves. */
  getByName(name: string): MikotoEmoji | undefined {
    const lower = name.toLowerCase();
    for (const emoji of this.cache.values()) {
      if (emoji.name.toLowerCase() === lower) return emoji;
    }
    return undefined;
  }

  /**
   * Add an emoji. `image` is the path the media server returned for an
   * upload to its `emoji` store.
   */
  async create(data: EmojiCreatePayload) {
    const emoji = await this.client.rest['emojis.create'](data, {
      params: { spaceId: this.space.id },
    });
    const existing = this._get(emoji.id);
    if (existing) return existing;
    const created = new MikotoEmoji(emoji, this.client);
    this._insert(created);
    return created;
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('emojis.onCreate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space || space.emojis._get(data.id)) return;
      space.emojis._insert(new MikotoEmoji(data, client));
    });

    client.ws.on('emojis.onUpdate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      space?.emojis._get(data.id)?._patch(data);
    });

    client.ws.on('emojis.onDelete', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      space?.emojis._delete(data.id);
    });
  }
}
