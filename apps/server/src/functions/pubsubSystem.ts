import Redis from 'ioredis';
import { z } from 'zod';
import { logger } from './logger';

export class PubSubSystem<M extends Record<string, z.ZodType>> {
  sender: Redis;
  receiver: Redis;
  handlers: { [P in keyof M]: ((arg: z.infer<M[P]>) => void)[] } = {} as any;

  constructor(redis: Redis, public messageMap: M) {
    this.sender = redis;
    this.receiver = redis.duplicate({ lazyConnect: true });
    Object.keys(messageMap).forEach((key) => {
      this.handlers[key as keyof M] = [];
    });

    this.receiver.on('message', (_, message) => {
      const { op, data } = JSON.parse(message);
      if (data) {
        this.handlers[op].forEach((fn) => fn(data));
      }
    });
  }

  async connect() {
    await this.receiver.connect();
  }

  async pub<K extends keyof M>(
    channel: string,
    key: K,
    message: z.input<M[K]>,
  ) {
    await this.sender.publish(
      channel,
      JSON.stringify({
        op: key,
        data: this.messageMap[key].parse(message),
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

  on<K extends keyof M>(evt: K, handler: (x: z.infer<M[K]>) => void) {
    this.handlers[evt].push(handler);
  }

  async close() {
    await this.receiver.quit();
  }
}
