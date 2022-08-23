import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

type InstanceEvents<T> = {
  update: (item: T) => void;
  delete: () => void;
};

export abstract class DeltaInstance<T> extends (EventEmitter as {
  new <U>(): TypedEmitter<InstanceEvents<U>>;
})<T> {
  abstract fetch(): Promise<T>;
}
