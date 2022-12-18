import type MikotoApi from '..';
import { Member, User } from '../models';

export class ClientMember implements Member {
  id: string;
  spaceId: string;
  user: User;
  roleIds: string[];

  constructor(private client: MikotoApi, base: Member) {
    this.id = base.id;
    this.spaceId = base.spaceId;
    this.user = base.user;
    this.roleIds = base.roleIds;
  }

  simplify(): Member {
    return {
      id: this.id,
      spaceId: this.spaceId,
      user: this.user,
      roleIds: this.roleIds,
    };
  }
}
