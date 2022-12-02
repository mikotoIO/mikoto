import { Space } from '../../models';
import type MikotoApi from '../index';
import { ChannelEngine } from '../engines/ChannelEngine';
import { ChannelUnreadInstance } from '../instances/ChannelUnreadInstance';
import { RoleEngine } from '../engines/RoleEngine';

export class ClientSpace {
  id: string;
  name: string;

  channels: ChannelEngine;
  unreads: ChannelUnreadInstance;
  roles: RoleEngine;

  constructor(private client: MikotoApi, base: Space) {
    this.id = base.id;
    this.name = base.name;

    this.channels = new ChannelEngine(client, this.id);
    this.unreads = new ChannelUnreadInstance(client, this.id);
    this.roles = new RoleEngine(client, this.id);
  }
}
