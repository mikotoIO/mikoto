import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { MessageExt, User } from '../api.gen';

export class ClientMessage implements MessageExt {
  id!: string;
  channelId!: string;
  authorId!: string | null | undefined;
  author!: User | null | undefined;
  content!: string;
  timestamp!: string;
  editedTimestamp!: string | null;

  get channel() {
    return this.client.channels.get(this.channelId)!;
  }

  get member() {
    if (!this.authorId) return null;
    return this.channel.space!.members?.get(this.authorId);
  }

  constructor(
    public client: MikotoClient,
    data: MessageExt,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }

  delete() {
    return this.client.api['messages.delete'](undefined, {
      params: {
        spaceId: this.channel.spaceId,
        channelId: this.channelId,
        messageId: this.id,
      },
    });
  }

  async edit(content: string) {
    const msg = await this.client.api['messages.update'](
      { content },
      {
        params: {
          spaceId: this.channel.spaceId,
          channelId: this.channelId,
          messageId: this.id,
        },
      },
    );
    Object.assign(this, msg);
  }
}
