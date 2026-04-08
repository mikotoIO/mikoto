import { proxy, ref } from 'valtio/vanilla';

import type { MikotoSpace } from '.';
import type { MikotoClient } from '../../MikotoClient';
import { MemberExt, MemberUpdatePayload } from '../../api.gen';
import { ZSchema } from '../../helpers/ZSchema';
import { CachedManager } from '../base';

export class MikotoMember extends ZSchema(MemberExt) {
  client!: MikotoClient;

  constructor(base: MemberExt, client: MikotoClient) {
    const cached = client.spaces._get(base.spaceId)?.members._get(base.userId);
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

  async ban(reason?: string) {
    await this.client.rest['bans.create'](
      { userId: this.userId, reason: reason ?? null },
      { params: { spaceId: this.spaceId } },
    );
  }

  checkPermission(action: string | bigint) {
    if (!this.space) return false;
    if (this.isOwner) return true;

    const act = typeof action === 'string' ? BigInt(action) : action;

    const totalPerms = this.roles.reduce(
      (acc, x) => (x ? acc | BigInt(x.permissions) : acc),
      0n,
    );

    return (act & totalPerms) !== 0n;
  }
}

const PAGE_SIZE = 100;

export class MemberManager extends CachedManager<MikotoMember> {
  hasMore = true;
  private nextCursor?: string;
  private fetching = false;

  constructor(public space: MikotoSpace) {
    super(space.client);
    return proxy(this);
  }

  override _insert(data: MikotoMember) {
    this.cache.set(data.userId, data);
  }

  reset() {
    this.cache.clear();
    this.hasMore = true;
    this.nextCursor = undefined;
    this.fetching = false;
  }

  async list() {
    if (!this.hasMore || this.fetching) return;
    this.fetching = true;
    try {
      const page = await this.client.rest['members.list']({
        params: { spaceId: this.space.id },
        queries: { limit: PAGE_SIZE, cursor: this.nextCursor },
      });
      page.forEach((member) =>
        this._insert(new MikotoMember(member, this.client)),
      );
      this.hasMore = page.length >= PAGE_SIZE;
      if (page.length > 0) {
        this.nextCursor = page[page.length - 1].id;
      }
    } finally {
      this.fetching = false;
    }
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
      const member = space.members._get(data.userId);
      if (member) member._patch(data);
    });

    client.ws.on('members.onDelete', (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.members._delete(data.userId);
    });
  }
}
