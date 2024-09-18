import { z } from 'zod';

import { websocketEvents } from './api.gen';

type WsEventValidators = typeof websocketEvents;
export type WsEvents = {
  [K in keyof WsEventValidators]: (
    event: z.infer<WsEventValidators[K]>,
  ) => void;
};
