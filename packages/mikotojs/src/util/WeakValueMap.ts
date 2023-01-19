export default class WeakValueMap<K, V extends object> {
  private finalizer: FinalizationRegistry<unknown>;
  public underlying: Map<K, WeakRef<V>>;

  constructor() {
    this.underlying = new Map<K, WeakRef<V>>();
    this.finalizer = new FinalizationRegistry((key: K) =>
      this.underlying.delete(key),
    );
  }

  private unregister(ref: WeakRef<V>) {
    const value = ref && ref.deref();
    if (value) this.finalizer.unregister(value);
  }

  get(key: K) {
    const ref = this.underlying.get(key);
    const value = ref && ref.deref();

    if (ref && !value) this.underlying.delete(key);

    return value;
  }

  set(key: K, value: V) {
    const r = this.underlying.get(key);
    if (r) {
      this.unregister(r);
    }

    this.finalizer.register(value, key, value);
    this.underlying.set(key, new WeakRef(value));
    return this;
  }

  delete(key: K) {
    const r = this.underlying.get(key);
    if (r) {
      this.unregister(r);
    }

    return this.underlying.delete(key);
  }

  clear() {
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of this.underlying.values()) this.unregister(ref);
    return this.underlying.clear();
  }
}
