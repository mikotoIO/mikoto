import { z } from 'zod';

/**
 * @description A runtime type-safe wrapper around localStorage
 */
export class LocalDB<T> {
  constructor(
    private key: string,
    private schema: z.ZodType<T>,
    private init: () => T,
  ) {}

  get(): T {
    const value = localStorage.getItem(this.key);
    if (!value) {
      return this.init();
    }

    try {
      return this.schema.parse(JSON.parse(value));
    } catch (_) {
      return this.init();
    }
  }

  set(value: T | ((prev: T) => T)) {
    if (typeof value === 'function') {
      const prev = this.get();
      this.set((value as any)(prev));
      return;
    }
    localStorage.setItem(this.key, JSON.stringify(this.schema.parse(value)));
  }
}
