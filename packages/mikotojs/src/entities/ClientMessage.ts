import type MikotoClient from '..';
import { Message, User } from '../models';
import type { ClientChannel } from './ClientChannel';

export class ClientMessage {
  public id: string;
  public content: string;
  public channel: ClientChannel;
  public timestamp: Date;
  public author: User | undefined;

  constructor(
    private client: MikotoClient,
    base: Message,
    channel: ClientChannel,
  ) {
    this.id = base.id;
    this.content = base.content;
    this.author = base.author;
    this.timestamp = new Date(base.timestamp);
    this.channel = channel;
  }
}
