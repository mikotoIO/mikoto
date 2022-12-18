import { Space } from '../models';
import type MikotoClient from '../index';
import { ChannelEngine } from '../engines/ChannelEngine';
import { ChannelUnreadInstance } from '../instances/ChannelUnreadInstance';
import { RoleEngine } from '../engines/RoleEngine';
import { ClientChannel } from './ClientChannel';
import { ClientRole } from './ClientRole';

export class ClientSpace {
  id: string;
  name: string;

  channels: ChannelEngine;
  unreads: ChannelUnreadInstance;
  roles: RoleEngine;

  constructor(private client: MikotoClient, base: Space) {
    this.id = base.id;
    this.name = base.name;

    this.channels = new ChannelEngine(
      client,
      this.id,
      base.channels.map((x) => new ClientChannel(client, x, this)),
    );
    this.unreads = new ChannelUnreadInstance(client, this.id);
    this.roles = new RoleEngine(client, this.id);
    base.roles.map((x) => new ClientRole(client, x));
  }

  createChannel(name: string, type: string) {
    return this.client.api.createChannel(this.id, { name, type });
  }
}
