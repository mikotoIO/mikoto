import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { ObjectWithID } from './cache';

export interface DeltaEngine<T extends ObjectWithID> {
  fetch(): Promise<T[]>;
  onCreate(fn: (item: T) => void): (item: T) => void;
  offCreate(fn: (item: T) => void): void;

  onDelete(fn: (item: T) => void): (item: T) => void;
  offDelete(fn: (item: T) => void): void;
}

type EngineEvents<T extends ObjectWithID> = {
  create: (item: T) => void;
  delete: (item: T) => void;
};

export abstract class DeltaEngineX<
  T extends ObjectWithID,
> extends (EventEmitter as {
  new <U extends ObjectWithID>(): TypedEmitter<EngineEvents<U>>;
})<T> {
  abstract fetch(): Promise<T[]>;
}
