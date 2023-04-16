import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { Channel, Message, Space } from '../models';

export type EmitterEvents<T> = {
  [key: `create/${string}`]: (message: T) => void;
  [key: `update/${string}`]: (message: T) => void;
  [key: `delete/${string}`]: (id: string) => void;
};

export class MessageEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<Message>
>) {
  // ...
}

export class ChannelEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<Channel>
>) {
  // ...
}

export class SpaceEmitter extends (EventEmitter as unknown as new () => TypedEmitter<
  EmitterEvents<Space>
>) {
  // ...
}
