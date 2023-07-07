import { RedisClientType } from 'redis';

// channel name -> message type
// type PubSubMap = {
//   messageCreate: Message;
// };

// typed wrapper for redis pubsub
export class RedisPubSub<M> {
  client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client.duplicate();
  }

  pub<T extends keyof M>(channel: T, id: string, message: M[T]) {
    this.client.publish(`${channel as string}:${id}`, JSON.stringify(message));
  }

  sub<T extends keyof M>(
    channel: T,
    id: string | string[],
    cb: (message: M[T]) => void,
  ) {
    if (Array.isArray(id)) {
      this.client.subscribe(
        id.map((i) => `${channel as string}:${i}`),
        (j) => {
          cb(JSON.parse(j) as M[T]);
        },
      );
      return;
    }
    this.client.subscribe(`${channel as string}:${id}`, (j) => {
      cb(JSON.parse(j) as M[T]);
    });
  }

  unsub<T extends keyof M>(channel: T, id?: string) {
    if (!id) {
      this.client.pUnsubscribe(`${channel as string}:*`);
      return;
    }
    this.client.unsubscribe(`${channel as string}:${id}`);
  }

  close() {
    this.client.quit();
  }
}
