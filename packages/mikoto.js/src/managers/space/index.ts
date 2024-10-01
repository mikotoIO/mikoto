import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../../MikotoClient';
import {
  type ChannelCreatePayload,
  SpaceExt,
  type SpaceUpdatePayload,
} from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';
import { MikotoChannel } from '../channel';
import { MemberManager } from './member';
import { RoleManager } from './role';

const SimpleSpaceExt = SpaceExt.omit({
  channels: true,
  roles: true,
});

export class MikotoSpace extends ZSchema(SimpleSpaceExt) {
  client!: MikotoClient;

  channelIds!: string[];
  members!: MemberManager;
  roles!: RoleManager;

  constructor(base: SpaceExt, client: MikotoClient) {
    const cached = client.spaces.cache.get(base.id);
    if (cached) {
      cached._patch(base);
      return cached;
    }

    super(base);
    const instance = proxy(this);
    client.spaces._insert(instance);

    this.client = ref(client);
    this.channelIds = base.channels.map(
      (channel) => new MikotoChannel(channel, client).id,
    );
    this.roles = new RoleManager(this, base.roles);
    this.members = new MemberManager(this);

    return instance;
  }

  _patch(data: SpaceExt) {
    Object.assign(this, SimpleSpaceExt.parse(data));
    this.roles._replace(data.roles);
  }

  get channels() {
    return this.channelIds
      .map((id) => this.client.channels._get(id))
      .filter((x) => !!x);
  }

  async edit(data: SpaceUpdatePayload) {
    await this.client.rest['spaces.update'](data, {
      params: { spaceId: this.id },
    });
    return this;
  }

  async delete() {
    await this.client.rest['spaces.delete'](undefined, {
      params: { spaceId: this.id },
    });
  }

  async leave() {
    await this.client.rest['spaces.leave'](undefined, {
      params: { spaceId: this.id },
    });
  }

  async listUnread() {
    const unread = await this.client.rest['channels.unreads']({
      params: { spaceId: this.id },
    });
    return unread;
  }

  async createChannel(data: ChannelCreatePayload) {
    const channel = await this.client.rest['channels.create'](data, {
      params: { spaceId: this.id },
    });
    return channel;
  }

  /**
   * Get member of the current user
   */
  get member() {
    return this.members._get(this.client.user.me!.id);
  }
}

export class SpaceManager extends CachedManager<MikotoSpace> {
  constructor(client: MikotoClient) {
    super(client);
    return proxy(this);
  }

  async list() {
    const spaces = await this.client.rest['spaces.list']();
    return spaces.map((space) => new MikotoSpace(space, this.client));
  }

  async join(invite: string) {
    const space = await this.client.rest['spaces.join'](undefined, {
      params: { invite },
    });
    return new MikotoSpace(space, this.client);
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('spaces.onCreate', (data) => {
      const space = new MikotoSpace(data, client);
      client.spaces._insert(space);
    });

    client.ws.on('spaces.onUpdate', (data) => {
      const space = client.spaces._get(data.id);
      if (space) space._patch(data);
    });

    client.ws.on('spaces.onDelete', (data) => {
      client.spaces._delete(data.id);
    });
  }
}

export * from './member';
export * from './role';
