import type { MikotoClient } from '../MikotoClient';
import { ClientChannel, ClientMessage } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class MessageEngine extends DeltaEngine<ClientMessage> {
  constructor(private client: MikotoClient, private channel: ClientChannel) {
    super();
  }

  async fetch(): Promise<ClientMessage[]> {
    return this.channel.getMessages();
  }
}
