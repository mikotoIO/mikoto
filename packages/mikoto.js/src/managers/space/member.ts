import { proxy, ref } from 'valtio/vanilla';

import type { MikotoSpace } from '.';
import type { MikotoClient } from '../../MikotoClient';
import { MemberExt, MemberUpdatePayload } from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';

export class MikotoMember extends ZSchema(MemberExt) {
  client!: MikotoClient;

  constructor(base: MemberExt, client: MikotoClient) {
    const cached = client.spaces._get(base.spaceId)?.members._get(base.id);
    if (cached) {
      cached._patch(base);
      return cached;
    }

    super(base);
    this.client = ref(client);

    return proxy(this);
  }

  get space() {
    return this.client.spaces.cache.get(this.spaceId);
  }

  get roles() {
    return this.roleIds.map((x) => this.space!.roles._get(x)!);
  }

  get roleColor() {
    for (const roleId of this.roleIds) {
      const role = this.space!.roles._get(roleId);
      if (role && role.color) {
        return role.color;
      }
    }
    return undefined;
  }

  get isOwner() {
    return this.space?.ownerId === this.userId;
  }

  _patch(data: MemberExt) {
    Object.assign(this, data);
  }

  async update(patch: MemberUpdatePayload) {
    await this.client.rest['members.update'](patch, {
      params: { userId: this.userId, spaceId: this.spaceId },
    });
  }

  async kick() {
    await this.client.rest['members.delete'](undefined, {
      params: { userId: this.userId, spaceId: this.spaceId },
    });
  }

  checkPermission(action: string | bigint, superuserOverride = true) {
    if (!this.space) return false;
    if (this.isOwner) return true;

    const roles = [...this.space.roles.cache.values()];

    let act = typeof action === 'string' ? BigInt(action) : action;
    if (superuserOverride) {
      // TODO: Check this at a later point to check for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      act |= BigInt(
        roles.find((x) => x.name === '@everyone')?.permissions ?? 0n,
      );
    }

    // const totalPerms = roles.reduce(
    //   (acc, x) => acc | BigInt(x.permissions),
    //   0n,
    // );
    return true; // FIXME: correct this
    // return this.client.checkPermission(act, totalPerms);
  }
}

export class MemberManager extends CachedManager<MikotoMember> {
  constructor(public space: MikotoSpace) {
    super(space.client);
    return proxy(this);
  }

  override _insert(data: MikotoMember) {
    this.cache.set(data.userId, data);
  }

  async list() {
    const res = await this.client.rest['members.list']({
      params: { spaceId: this.space.id },
    });
    res.forEach((member) =>
      this._insert(new MikotoMember(member, this.client)),
    );
    return res;
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('members.onCreate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.members._insert(new MikotoMember(data, client));
    });

    client.ws.on('members.onUpdate', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      const member = space.members._get(data.id);
      if (member) member._patch(data);
    });

    client.ws.on('members.onDelete', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.members._delete(data.userId);
    });
  }
}
