import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { RelationState, Relationship, SpaceExt, User } from '../api.gen';
import { Store } from './base';

export class ClientRelation implements Relationship {
  id!: string;
  space!: SpaceExt | null | undefined;
  state!: RelationState;
  relation!: User | null | undefined;
  userId!: string;
  relationId!: string;

  constructor(
    public client: MikotoClient,
    data: Relationship,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}

export class RelationStore extends Store<Relationship, ClientRelation> {
  async fetch(id: string, data?: Relationship) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData =
      data ??
      (await this.client.api['relations.get']({
        params: { relationId: id },
      }));
    return this.produce(cData);
  }

  async list(reload?: boolean) {
    if (reload) {
      const a = await this.client.api['relations.list']();
      const list = a.map((x) => this.fetch(x.id, x));
      await Promise.all(list);
    }

    return Array.from(this.values());
  }
}
