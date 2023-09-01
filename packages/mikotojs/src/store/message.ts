import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Message, User } from '../schema';

export class ClientMessage implements Message {
  id!: string;
  channelId!: string;
  authorId!: string | null;
  author!: User | null;
  content!: string;
  timestamp!: string;
  editedTimestamp!: string | null;

  get channel() {
    return this.client.channels.get(this.channelId)!;
  }

  get member() {
    if (this.authorId === null) return null;
    return this.channel.space!.members?.get(this.authorId);
  }

  constructor(public client: MikotoClient, data: Message) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}
