import type { MikotoClient } from '../MikotoClient';
import { Member, User } from '../models';

export class ClientMember implements Member {
  id: string;
  spaceId: string;
  user: User;
  roleIds: string[];

  constructor(private client: MikotoClient, base: Member) {
    this.id = base.id;
    this.spaceId = base.spaceId;
    this.user = base.user;
    this.roleIds = base.roleIds;
  }

  async update(options: { roleIds: string[] }) {
    return this.client.client.members.update(
      this.spaceId,
      this.user.id,
      options,
    );
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
