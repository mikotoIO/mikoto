import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../../MikotoClient';
import { Emoji } from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';
import type { MikotoSpace } from '.';

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

  async edit(name: string) {
    const emoji = await this.client.rest['emojis.update'](
      { name },
      { params: { spaceId: this.spaceId, emojiId: this.id } },
    );
    this._patch(emoji);
    return this;
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

  /**
   * Look up a custom emoji by its short name.
   */
  getByName(name: string): MikotoEmoji | undefined {
    for (const emoji of this.cache.values()) {
      if (emoji.name === name) return emoji;
    }
    return undefined;
  }

  async list() {
    const emojis = await this.client.rest['emojis.list']({
      params: { spaceId: this.space.id },
    });
    this._replace(emojis);
    return this.values();
  }

  async create(payload: { name: string; url: string }) {
    const emoji = await this.client.rest['emojis.create'](payload, {
      params: { spaceId: this.space.id },
    });
    const instance = new MikotoEmoji(emoji, this.client);
    this._insert(instance);
    return instance;
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('emojis.onCreate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.emojis._insert(new MikotoEmoji(data, client));
    });

    client.ws.on('emojis.onUpdate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      const emoji = space.emojis._get(data.id);
      if (emoji) emoji._patch(data);
      else space.emojis._insert(new MikotoEmoji(data, client));
    });

    client.ws.on('emojis.onDelete', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.emojis._delete(data.id);
    });
  }
}
