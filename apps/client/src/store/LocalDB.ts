import { useLocalStorage } from 'usehooks-ts';
import { z } from 'zod';

/**
 * @description A runtime type-safe wrapper around localStorage
 */
export class LocalDB<T> {
  constructor(
    public key: string,
    public schema: z.ZodType<T>,
    public init: () => T,
  ) {
    if (!localStorage.getItem(this.key)) {
      this.set(this.init());
    }
  }

  get(): T {
    const value = localStorage.getItem(this.key);
    if (!value) {
      return this.init();
    }

    try {
      return this.schema.parse(JSON.parse(value));
    } catch {
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

export function useLocalDB<T>(db: LocalDB<T>) {
  return useLocalStorage(db.key, db.init());
}
