import { proxy, ref } from 'valtio/vanilla';

import { MikotoClient } from '../MikotoClient';
import { Relationship } from '../api.gen';
import { ZSchema } from '../helpers/ZSchema';
import { CachedManager } from './base';

export class MikotoRelationship extends ZSchema(Relationship) {
  client!: MikotoClient;

  constructor(base: Relationship, client: MikotoClient) {
    const cached = client.relationships.cache.get(base.id);
    if (cached) {
      cached._patch(base);
      return cached;
    }

    super(base);
    this.client = ref(client);

    const instance = proxy(this);
    this.client.relationships._insert(instance);
    return instance;
  }

  _patch(data: Relationship) {
    Object.assign(this, data);
  }
}

export class RelationshipManager extends CachedManager<MikotoRelationship> {}
