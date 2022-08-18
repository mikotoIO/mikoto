export interface ObjectWithID {
  id: string;
}

export class MikotoCache<T extends ObjectWithID> {
  private cache: Map<string, T>;
  constructor(private max = 200) {
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

  first(): string {
    return this.cache.keys().next().value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}
