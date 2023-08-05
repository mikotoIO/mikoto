import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Member, User } from '../schema';
import { Store, normalizedAssign } from './base';

export class ClientMember implements Member {
  id!: string;
  spaceId!: string;
  userId!: string;
  roleIds!: string[];
  user!: User;

  get space() {
    return this.client.spaces.get(this.spaceId)!;
  }

  get isSpaceOwner() {
    return this.space.ownerId === this.userId;
  }

  constructor(public client: MikotoClient, data: Member) {
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
}

export class MemberStore extends Store<Member, ClientMember> {
  foreignCreate(data: Member) {
    console.log(data);

    this.client.spaces
      .get(data.spaceId)
      ?.members?.set(data.user.id, this.produce(data));
  }

  foreignDelete(item: ClientMember): void {
    this.client.spaces.get(item.spaceId)?.members?.delete(item.user.id);
  }
}
