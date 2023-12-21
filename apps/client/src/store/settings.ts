import { z } from 'zod';

// Settings object
// to be persisted in localstorage
// this is synced with the server, so must be JSON serializable
export const settings = z
  .object({
    spaces: z.array(z.string()),

    theme: z.enum(['dark', 'light']),
  })
  .partial();
