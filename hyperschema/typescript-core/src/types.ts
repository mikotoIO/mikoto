import { z } from 'zod';

export function hsDate(): z.ZodEffects<z.ZodString, string, Date | string> {
  return z.preprocess(
    (val) => (val instanceof Date ? val.toISOString() : val),
    z.string(),
  ) as any;
}
