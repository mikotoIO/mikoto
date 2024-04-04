import { ZodType, z } from 'zod';

type CleanupFn = (() => void) | void;

export class HyperRPCEvent<Ctx, T extends ZodType> {
  emitterSetup?: (emit: (x: z.infer<T>) => void, ctx: Ctx) => CleanupFn;
  constructor(public eventType: T) {}
  emitter(setup: (emit: (x: z.infer<T>) => void, ctx: Ctx) => CleanupFn) {
    this.emitterSetup = setup;
    return this;
  }
  filter(fn: (input: z.infer<T>) => Promise<boolean>) {}
}
