import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { Channel, MessageExt, SpaceExt } from '../api.gen';

export type EmitterEvents<T> = {
  [key: `create/${string}`]: (message: T) => void;
  [key: `update/${string}`]: (message: T) => void;
  [key: `delete/${string}`]: (id: string) => void;
};

export class MessageEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<MessageExt>
>) {
  // ...
}

export class ChannelEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<Channel>
>) {
  // ...
}

// the scope is always "@"
export class SpaceEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<SpaceExt>
>) {
  // ...
}
