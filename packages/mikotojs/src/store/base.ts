import { action, runInAction } from 'mobx';

import type { MikotoClient } from '../MikotoClient';

interface EntityBase {
  id: string;
}

const updateAction = action(
  <B extends EntityBase, T extends B>(entity: T, data: B) => {
    const { id, ...rest } = data;
    Object.assign(entity, rest);
  },
);

interface EntityConstructor<B extends EntityBase, T extends B> {
  new (client: MikotoClient, data: B): T;
}

export interface DeltaSystem<T extends EntityBase> {
  onCreate(fn: (entity: T) => void): void;
  onUpdate(fn: (entity: T) => void): void;
  onDelete(fn: (entity: T) => void): void;
}

export abstract class Store<B extends EntityBase, T extends B> extends Map<
  string,
  T
> {
  constructor(
    protected client: MikotoClient,
    protected Ent: EntityConstructor<B, T>,
  ) {
    super();
  }

  // overridable
  expand(data: B): void {}
  foreignCreate(item: T): void {}
  foreignDelete(item: T): void {}

  // errors if ID is not found w/o data
  // updates the object if ID is found w/ data
  getAndUpdate(id: string, data?: B) {
    const entity = this.get(id)!;
    if (data) {
      updateAction(entity, data);
    }
    return entity;
  }
  // creates a new object if ID is not found
  // updates the object if ID is found
  produce(data: B): T {
    if (this.has(data.id)) {
      const entity = this.get(data.id)!;
      updateAction(entity, data);
      return entity;
    }
    const entity = new this.Ent(this.client, data);
    return runInAction(() => {
      this.expand(data);
      this.set(entity.id, entity);
      return entity;
    });
  }

  subscribe(delta: DeltaSystem<B>) {
    delta.onCreate(
      action((data) => {
        const ent = this.produce(data);
        this.foreignCreate(ent);
      }),
    );
    delta.onUpdate(
      action((data) => {
        this.getAndUpdate(data.id, data);
      }),
    );
    delta.onDelete(
      action((data) => {
        const ent = this.get(data.id);
        if (ent) {
          this.foreignDelete(ent);
        }
        this.delete(data.id);
      }),
    );
  }
}

// toNormalized fields are not assigned to the entity
// instead, they are assigned to the entity's ID field
export function normalizedAssign<B extends EntityBase, T extends B>(
  entity: T,
  data: B,
  toNormalize: Partial<Record<keyof B, string>> = {},
) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(data) as (keyof B)[]) {
    if (!toNormalize[key]) {
      entity[key] = data[key] as any;
    } else {
      const idKey = toNormalize[key];
      if (idKey?.slice(-1) === 's') {
        (entity as any)[idKey] = (data[key] as EntityBase[]).map((x) => x.id);
      } else {
        (entity as any)[idKey] = (data[key] as EntityBase).id;
      }
    }
  }
}
