import { DeltaEngine } from './DeltaEngine';
import { Message } from '../../models';
import type MikotoClient from '../index';

export class MessageEngine extends DeltaEngine<Message> {
  constructor(private client: MikotoClient, private channelId: string) {
    super();
  }

  async fetch(): Promise<Message[]> {
    return this.client.getMessages(this.channelId);
  }
}
