import { z } from 'zod';

// Settings object
// to be persisted in localstorage
export const settings = z
  .object({
    spaces: z.array(z.string()),

    theme: z.enum(['dark', 'light']),
  })
  .partial();
