import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Relation, Space, User } from '../hs-client';
import { Store } from './base';

export class ClientRelation implements Relation {
  id!: string;
  space!: Space | null;
  relation!: User | null;

  constructor(
    public client: MikotoClient,
    data: Relation,
  ) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}

export class RelationStore extends Store<Relation, ClientRelation> {
  async fetch(id: string, data?: Relation) {
    if (this.has(id)) return this.getAndUpdate(id, data);
    const cData =
      data ??
      (await this.client.client.relations.get({
        relationId: id,
      }));
    return this.produce(cData);
  }

  async list(reload?: boolean) {
    if (reload) {
      const a = await this.client.client.relations.list({});
      const list = a.map((x) => this.fetch(x.id, x));
      await Promise.all(list);
    }

    return Array.from(this.values());
  }
}
