import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { Message } from '../models';

type MessageEmitterEvents = {
  [key: `create/${string}`]: (message: Message) => void;
  [key: `update/${string}`]: (message: Message) => void;
  [key: `delete/${string}`]: (id: string) => void;
};

export class MessageEmitter extends (EventEmitter as unknown as new () => TypedEmitter<MessageEmitterEvents>) {
  // ...
}
