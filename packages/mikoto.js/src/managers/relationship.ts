import { proxy, ref } from 'valtio/vanilla';

import { MikotoClient } from '../MikotoClient';
import { RelationshipExt } from '../api.gen';
import { ZSchema } from '../helpers/ZSchema';
import { CachedManager } from './base';

export class MikotoRelationship extends ZSchema(RelationshipExt) {
  client!: MikotoClient;

  constructor(base: RelationshipExt, client: MikotoClient) {
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

  _patch(data: RelationshipExt) {
    Object.assign(this, data);
  }

  async accept() {
    return this.client.rest['relations.accept'](undefined, {
      params: { relationId: this.relationId },
    });
  }

  async decline() {
    return this.client.rest['relations.decline'](undefined, {
      params: { relationId: this.relationId },
    });
  }

  async remove() {
    return this.client.rest['relations.remove'](undefined, {
      params: { relationId: this.relationId },
    });
  }

  async block() {
    return this.client.rest['relations.block'](undefined, {
      params: { relationId: this.relationId },
    });
  }

  async unblock() {
    return this.client.rest['relations.unblock'](undefined, {
      params: { relationId: this.relationId },
    });
  }

  async openDm() {
    return this.client.rest['relations.openDm'](undefined, {
      params: { relationId: this.relationId },
    });
  }
}

export class RelationshipManager extends CachedManager<MikotoRelationship> {
  constructor(client: MikotoClient) {
    super(client);
    return proxy(this);
  }

  async list() {
    const rels = await this.client.rest['relations.list']();
    return rels.map((r) => new MikotoRelationship(r, this.client));
  }

  async sendRequest(userId: string) {
    const rel = await this.client.rest['relations.sendRequest'](undefined, {
      params: { relationId: userId },
    });
    return new MikotoRelationship(rel, this.client);
  }

  get friends() {
    return this.values().filter((r) => r.state === 'FRIEND');
  }

  get pending() {
    return this.values().filter(
      (r) => r.state === 'INCOMING_REQUEST' || r.state === 'OUTGOING_REQUEST',
    );
  }

  get blocked() {
    return this.values().filter((r) => r.state === 'BLOCKED');
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on('relations.onCreate', (data) => {
      new MikotoRelationship(data, client);
    });

    client.ws.on('relations.onUpdate', (data) => {
      const existing = client.relationships.cache.get(data.id);
      if (existing) {
        existing._patch(data);
      } else {
        new MikotoRelationship(data, client);
      }
    });

    client.ws.on('relations.onDelete', (data) => {
      client.relationships._delete(data.id);
    });
  }
}
