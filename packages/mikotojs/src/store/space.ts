import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Channel, Role, Space } from '../schema';
import { Store, normalizedAssign } from './base';
import { ClientChannel } from './channel';

export class ClientSpace implements Space {
  id!: string;
  name!: string;
  icon!: string | null;
  roles!: Role[];
  ownerId!: string | null;
  channelIds!: string[];

  constructor(public client: MikotoClient, data: Space) {
    normalizedAssign(this, data, { channels: 'channelIds' });
    makeAutoObservable(this, { id: false, client: false });
  }

  get channels(): ClientChannel[] {
    return this.channelIds.map((x) => this.client.channels.get(x)!);
  }
}

export class SpaceStore extends Store<Space, ClientSpace> {
  async fetch(id: string, data?: Space) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData = data ?? (await this.client.client.spaces.get(id));
    return this.produce(cData);
  }

  expand(data: Space) {
    data.channels.forEach((x) => this.client.channels.produce(x));
  }

  async list(reload?: boolean) {
    if (reload) {
      const a = await this.client.client.spaces.list();
      const list = a.map((x) => this.fetch(x.id, x));
      await Promise.all(list);
    }

    return Array.from(this.values());
  }
}
