export interface ObjectWithID {
  id: string;
}

export interface ICache<T extends ObjectWithID> {
  get(id: string): T | undefined;
  set(data: T): T;
  delete(id: string): void;
  toMap(): Map<string, T>;
}

// just a thin wrapper around Map to maintain compat with MikotoCache
export class InfiniteCache<T extends ObjectWithID> implements ICache<T> {
  private readonly cache: Map<string, T>;
  constructor() {
    this.cache = new Map<string, T>();
  }
  get(id: string): T | undefined {
    return this.cache.get(id);
  }
  set(obj: T): T {
    this.cache.set(obj.id, obj);
    return obj;
  }
  delete(id: string): boolean {
    return this.cache.delete(id);
  }
  toMap(): Map<string, T> {
    return this.cache;
  }
}

export class MikotoCache<T extends ObjectWithID> implements ICache<T> {
  private readonly cache: Map<string, T>;
  constructor(private max = 100000) {
    this.cache = new Map<string, T>();
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      // refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(item: T) {
    // refresh key
    if (this.cache.has(item.id)) return item;
    // evict oldest
    if (this.cache.size === this.max) this.cache.delete(this.first());
    this.cache.set(item.id, item);
    return item;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  toMap(): Map<string, T> {
    return this.cache;
  }

  private first(): string {
    return this.cache.keys().next().value;
  }
}
