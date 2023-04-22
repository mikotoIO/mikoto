import { Space } from '../schema';

import type { MikotoClient } from '../MikotoClient';
import { ClientMember } from './ClientMember';
import { ClientRole } from './ClientRole';

export class ClientSpace {
  id: string;
  name: string;

  // channels: ChannelEngine;
  // unreads: ChannelUnreadInstance;
  // roles: RoleEngine;

  constructor(private client: MikotoClient, base: Space) {
    this.id = base.id;
    this.name = base.name;

    // this.unreads = new ChannelUnreadInstance(client, this.id);
    // this.roles = new RoleEngine(
    //   client,
    //   this.id,
    //   base.roles.map((x) => new ClientRole(client, x)),
    // );
    base.roles.map((x) => new ClientRole(client, x));
  }

  createChannel(name: string, type: string) {
    return this.client.client.channels.create(this.id, { name, type });
  }

  async getMember(userId: string) {
    const base = await this.client.client.members.get(this.id, userId);
    return new ClientMember(this.client, base);
  }
}
