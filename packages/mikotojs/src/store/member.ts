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

  constructor(public client: MikotoClient, data: Member) {
    normalizedAssign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }

  get roleColor() {
    // eslint-disable-next-line no-restricted-syntax
    for (const roleId of this.roleIds) {
      const role = this.space.roles.find((x) => x.id === roleId);
      if (role && role.color) {
        return role.color;
      }
    }
    return undefined;
  }
}

export class MemberStore extends Store<Member, ClientMember> {}
