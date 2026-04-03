import { proxy, ref } from 'valtio/vanilla';

import { MikotoClient } from '../MikotoClient';
import { type OpenDmResponse, Relationship } from '../api.gen';
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

export class RelationshipManager extends CachedManager<MikotoRelationship> {
  /** Fetch all relationships from the server and populate the cache. */
  async list(): Promise<MikotoRelationship[]> {
    const data = await this.client.rest['relations.list']();
    return data.map((r: Relationship) => new MikotoRelationship(r, this.client));
  }

  /** Send a friend request. */
  async request(userId: string): Promise<MikotoRelationship> {
    const data = await this.client.rest['relations.request'](undefined, {
      params: { userId },
    });
    return new MikotoRelationship(data, this.client);
  }

  /** Accept an incoming friend request. */
  async accept(userId: string): Promise<MikotoRelationship> {
    const data = await this.client.rest['relations.accept'](undefined, {
      params: { userId },
    });
    return new MikotoRelationship(data, this.client);
  }

  /** Block a user. */
  async block(userId: string): Promise<MikotoRelationship> {
    const data = await this.client.rest['relations.block'](undefined, {
      params: { userId },
    });
    return new MikotoRelationship(data, this.client);
  }

  /** Remove a relationship (unfriend, cancel request, etc). */
  async remove(userId: string): Promise<void> {
    await this.client.rest['relations.remove'](undefined, {
      params: { userId },
    });
    // Remove from cache — find by relationId
    for (const [id, rel] of this.cache) {
      if (rel.relationId === userId) {
        this.cache.delete(id);
        break;
      }
    }
  }

  /** Open or create a DM with a user. */
  async openDm(relationId: string): Promise<OpenDmResponse> {
    return this.client.rest['relations.openDm'](undefined, {
      params: { relationId },
    });
  }

  /** Subscribe to WebSocket events for relationship updates. */
  static _subscribe(client: MikotoClient) {
    client.ws.on('relations.onRequest', (data) => {
      new MikotoRelationship(data, client);
    });

    client.ws.on('relations.onAccept', (data) => {
      const existing = client.relationships._get(data.id);
      if (existing) {
        existing._patch(data);
      } else {
        new MikotoRelationship(data, client);
      }
    });

    client.ws.on('relations.onRemove', (data) => {
      // data is ObjectWithId — the ID of the removed relation target
      // Find and remove the relationship from cache
      for (const [id, rel] of client.relationships.cache) {
        if (rel.relationId === data.id) {
          client.relationships._delete(id);
          break;
        }
      }
    });
  }
}
