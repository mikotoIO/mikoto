import type { MikotoClient } from '../MikotoClient';
import { ClientChannel, ClientMessage } from '../entities';
import { DeltaEngine } from './DeltaEngine';

export class MessageEngine extends DeltaEngine<ClientMessage> {
  constructor(private client: MikotoClient, private channel: ClientChannel) {
    console.log('messageengine constructed with ID ' + channel.id);
    super();
  }

  async fetch(): Promise<ClientMessage[]> {
    return this.channel.getMessages();
  }
}
