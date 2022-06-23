import { DeltaEngine } from '../deltaEngine';
import { Message } from '../../models';
import type MikotoApi from '../index';

export class MessageEngine extends DeltaEngine<Message> {
  constructor(private client: MikotoApi, private channelId: string) {
    super();
  }

  async fetch(): Promise<Message[]> {
    return this.client.getMessages(this.channelId);
  }
}
