import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { ObjectWithID } from '../cache';

type EngineEvents<T extends ObjectWithID> = {
  create: (item: T) => void;
  delete: (id: string) => void;
  update: (item: T) => void;
};

export abstract class DeltaEngine<
  T extends ObjectWithID,
> extends (EventEmitter as {
  new <U extends ObjectWithID>(): TypedEmitter<EngineEvents<U>>;
})<T> {
  abstract fetch(): Promise<T[]>;
  get(id: string): T | undefined {
    return undefined;
  }
}
