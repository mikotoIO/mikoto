import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { MemberExt, MemberUpdatePayload, User } from '../api.gen';
import { Store, normalizedAssign } from './base';

export class ClientMember implements MemberExt {
  id!: string;
  roleIds!: string[];
  spaceId!: string;
  userId!: string;
  user!: User;

  get space() {
    return this.client.spaces.get(this.spaceId)!;
  }

  get isSpaceOwner() {
    return this.space.ownerId === this.user.id;
  }

  constructor(
    public client: MikotoClient,
    data: MemberExt,
  ) {
    normalizedAssign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }

  get roles() {
    return this.roleIds.map((x) => this.client.roles.get(x)!);
  }

  get roleColor() {
    // eslint-disable-next-line no-restricted-syntax
    for (const roleId of this.roleIds) {
      const role = this.client.roles.get(roleId);
      if (role && role.color) {
        return role.color;
      }
    }
    return undefined;
  }

  async update(options: MemberUpdatePayload) {
    await this.client.api['members.update'](options, {
      params: {
        spaceId: this.spaceId,
        userId: this.userId,
      },
    });
  }

  async kick() {
    await this.client.api['members.delete'](undefined, {
      params: {
        spaceId: this.spaceId,
        userId: this.userId,
      },
    });
  }
}

export class MemberStore extends Store<MemberExt, ClientMember> {
  foreignCreate(data: MemberExt) {
    this.client.spaces
      .get(data.spaceId)
      ?.members?.set(data.user.id, this.produce(data));
  }

  foreignDelete(item: MemberExt): void {
    this.client.spaces.get(item.spaceId)?.members?.delete(item.user.id);
  }
}
