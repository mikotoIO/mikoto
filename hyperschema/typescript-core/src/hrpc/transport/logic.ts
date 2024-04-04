import { HyperRPCService } from '..';
import { BaseError } from '../../errors';

export function processError(err: unknown) {
  if (err instanceof BaseError) {
    return {
      message: err.message,
      code: err.code,
    };
  }
  if (err instanceof Error) {
    return {
      message: err.message,
    };
  }
  return { message: 'Unknown Error' };
}

export interface AbstractTransportEngine {
  mount(service: HyperRPCService<any>): void;
  run(): Promise<void>;
}
