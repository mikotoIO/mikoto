import { DeltaEngine } from './DeltaEngine';
import type MikotoClient from '../index';
import type { ClientChannel } from '../entities/ClientChannel';
import { ClientMessage } from '../entities/ClientMessage';

export class MessageEngine extends DeltaEngine<ClientMessage> {
  constructor(private client: MikotoClient, private channel: ClientChannel) {
    super();
  }

  async fetch(): Promise<ClientMessage[]> {
    return this.channel.getMessages();
  }
}
