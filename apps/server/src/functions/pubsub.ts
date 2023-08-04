import { Redis } from 'ioredis';

// channel name -> message type
// type PubSubMap = {
//   messageCreate: Message;
// };

// typed wrapper for redis pubsub
export class RedisPubSub<M> {
  private sender: Redis;
  private receiver: Redis;

  constructor(redis: Redis) {
    this.sender = redis;
    this.receiver = redis.duplicate({ lazyConnect: true });
  }

  async connect() {
    await this.receiver.connect();
  }

  async pub(channel: string, message: any) {
    await this.sender.publish(channel, JSON.stringify(message));
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

  on(fn: (x: any) => void) {
    this.receiver.on('message', (channel, message) => {
      // TODO: COME UP WITH A TYPE FOR THIS
      fn(JSON.parse(message));
    });
  }

  async close() {
    await this.receiver.quit();
  }
}
