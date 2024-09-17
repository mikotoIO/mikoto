import { ObservableMap, makeAutoObservable, runInAction } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import {
  ChannelType,
  ChannelUnread,
  SpaceExt,
  SpaceType,
  SpaceUpdatePayload,
} from '../api.gen';
import { Store, normalizedAssign } from './base';
import { ClientChannel } from './channel';
import { ClientMember } from './member';
import { ClientRole } from './role';

export class ClientSpace implements SpaceExt {
  id!: string;
  name!: string;
  type!: SpaceType;
  icon!: string | null | undefined;
  ownerId: string | null | undefined;

  channelIds!: string[];
  roleIds!: string[];

  // null means members hasn't been fetched yet
  members: ObservableMap<string, ClientMember> | null = null;

  constructor(
    public client: MikotoClient,
    data: SpaceExt,
  ) {
    normalizedAssign(this, data, { channels: 'channelIds', roles: 'roleIds' });
    makeAutoObservable(this, { id: false, client: false });
  }

  get channels(): ClientChannel[] {
    return this.channelIds.map((x) => this.client.channels.get(x)!);
  }

  get roles(): ClientRole[] {
    return this.roleIds.map((x) => this.client.roles.get(x)!);
  }

  get member() {
    return this.members?.get(this.client.me.id);
  }

  async listUnread(): Promise<ChannelUnread[]> {
    return await this.client.api['channels.unreads']({
      params: { spaceId: this.id },
    });
  }

  sortRoles() {
    this.roleIds.sort((a, b) => {
      const roleA = this.client.roles.get(a)!;
      const roleB = this.client.roles.get(b)!;
      return roleB.position - roleA.position;
    });
  }

  async fetchMembers(forceSync?: boolean) {
    if (this.members && !forceSync) return;
    const members = await this.client.api['members.list']({
      params: { spaceId: this.id },
    });

    runInAction(() => {
      this.members = new ObservableMap(
        members.map((x) => [x.user.id, this.client.members.produce(x)]),
      );
    });
  }

  async createChannel(data: {
    name: string;
    parentId: string | null;
    type: ChannelType;
  }) {
    return await this.client.api['channels.create'](
      {
        name: data.name,
        parentId: data.parentId,
        type: data.type,
      },
      {
        params: { spaceId: this.id },
      },
    );
  }

  update(options: SpaceUpdatePayload) {
    return this.client.api['spaces.update'](options, {
      params: { spaceId: this.id },
    });
  }

  leave() {
    return this.client.api['spaces.leave'](undefined, {
      params: { spaceId: this.id },
    });
  }
}

export class SpaceStore extends Store<SpaceExt, ClientSpace> {
  async fetch(id: string, data?: SpaceExt) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData =
      data ??
      (await this.client.api['spaces.get']({
        params: { spaceId: id },
      }));
    return this.produce(cData);
  }

  expand(data: SpaceExt) {
    data.channels.forEach((x) => this.client.channels.produce(x));
    data.roles.forEach((x) => this.client.roles.produce(x));
  }

  async list(reload?: boolean) {
    if (reload) {
      const a = await this.client.api['spaces.list']();
      const list = a.map((x) => this.fetch(x.id, x));
      await Promise.all(list);
    }

    return Array.from(this.values());
  }
}
