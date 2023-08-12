import { Redis } from 'ioredis';

// channel name -> message type
// type PubSubMap = {
//   messageCreate: Message;
// };

// typed wrapper for redis pubsub
export class RedisPubSub<M extends Record<string, (arg: any) => void>> {
  private sender: Redis;
  private receiver: Redis;
  private handlers: M;

  constructor(redis: Redis, handlers: (ps: RedisPubSub<M>) => M) {
    this.sender = redis;
    this.receiver = redis.duplicate({ lazyConnect: true });
    this.handlers = handlers(this);
  }

  async connect() {
    await this.receiver.connect();
  }

  async pub<K extends keyof M>(
    channel: string,
    key: K,
    message: Parameters<M[K]>[0],
  ) {
    await this.sender.publish(
      channel,
      JSON.stringify({
        op: key,
        data: message,
      }),
    );
  }

  async sub(id: string | string[]) {
    if (Array.isArray(id)) {
      await this.receiver.subscribe(...id.map((s) => s));
      return;
    }
    await this.receiver.subscribe(id);
  }

  async unsub(id?: string) {
    if (!id) {
      await this.receiver.unsubscribe();
      return;
    }
    this.receiver.unsubscribe(id);
  }

  on() {
    this.receiver.on('message', (channel, message) => {
      // TODO: COME UP WITH A TYPE FOR THIS
      const { op, data } = JSON.parse(message);
      if (data) {
        this.handlers[op](data);
      }
    });
  }

  async close() {
    await this.receiver.quit();
  }
}
