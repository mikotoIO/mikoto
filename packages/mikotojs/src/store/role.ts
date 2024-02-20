import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Role } from '../hs-client';
import { Store, normalizedAssign } from './base';

export class ClientRole implements Role {
  id!: string;
  name!: string;
  color!: string | null;
  position!: number;
  permissions!: string;
  spaceId!: string;

  constructor(
    public client: MikotoClient,
    data: Role,
  ) {
    normalizedAssign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}

export class RoleStore extends Store<Role, ClientRole> {
  foreignCreate(data: Role) {
    const space = this.client.spaces.get(data.spaceId);
    if (space) {
      space.roleIds.push(data.id);
      space.sortRoles();
    }
  }

  foreignUpdate(item: ClientRole): void {
    const space = this.client.spaces.get(item.spaceId);
    if (space) {
      space.sortRoles();
    }
  }

  foreignDelete(data: Role) {
    const space = this.client.spaces.get(data.spaceId);
    if (!space) return;
    space.roleIds = space.roleIds.filter((x) => x !== data.id);
    // this may be overkill
    space.members?.forEach((member) => {
      member.roleIds = member.roleIds.filter((x) => x !== data.id);
    });
  }
}
