import { ObservableMap, makeAutoObservable, runInAction } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Space, SpaceUpdateOptions } from '../hs-client';
import { Store, normalizedAssign } from './base';
import { ClientChannel } from './channel';
import { ClientMember } from './member';
import { ClientRole } from './role';

export class ClientSpace implements Space {
  id!: string;
  name!: string;
  type!: string;
  icon!: string | null;
  ownerId!: string | null;

  channelIds!: string[];
  roleIds!: string[];

  // null means members hasn't been fetched yet
  members: ObservableMap<string, ClientMember> | null = null;

  constructor(public client: MikotoClient, data: Space) {
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

  sortRoles() {
    this.roleIds.sort((a, b) => {
      const roleA = this.client.roles.get(a)!;
      const roleB = this.client.roles.get(b)!;
      return roleB.position - roleA.position;
    });
  }

  async fetchMembers(forceSync?: boolean) {
    if (this.members && !forceSync) return;
    const members = await this.client.client.members.list({
      spaceId: this.id,
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
    type: string;
  }) {
    return await this.client.client.channels.create({
      name: data.name,
      spaceId: this.id,
      parentId: data.parentId,
      type: data.type,
    });
  }

  update(options: SpaceUpdateOptions) {
    return this.client.client.spaces.update({
      spaceId: this.id,
      options,
    });
  }

  leave() {
    return this.client.client.spaces.leave({ spaceId: this.id });
  }
}

export class SpaceStore extends Store<Space, ClientSpace> {
  async fetch(id: string, data?: Space) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData =
      data ??
      (await this.client.client.spaces.get({
        spaceId: id,
      }));
    return this.produce(cData);
  }

  expand(data: Space) {
    data.channels.forEach((x) => this.client.channels.produce(x));
    data.roles.forEach((x) => this.client.roles.produce(x));
  }

  async list(reload?: boolean) {
    if (reload) {
      const a = await this.client.client.spaces.list({});
      const list = a.map((x) => this.fetch(x.id, x));
      await Promise.all(list);
    }

    return Array.from(this.values());
  }
}
