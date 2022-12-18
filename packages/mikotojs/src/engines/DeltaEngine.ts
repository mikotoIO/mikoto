import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { ObjectWithID } from '../cache';

type EngineEvents<T extends ObjectWithID> = {
  create: (item: T) => void;
  delete: (item: T) => void;
  update: (item: T) => void;
};

export abstract class DeltaEngine<
  T extends ObjectWithID,
> extends (EventEmitter as {
  new <U extends ObjectWithID>(): TypedEmitter<EngineEvents<U>>;
})<T> {
  abstract fetch(): Promise<T[]>;
}
