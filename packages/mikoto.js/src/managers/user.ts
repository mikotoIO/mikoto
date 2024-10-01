import { proxy, ref } from 'valtio/vanilla';

import type { MikotoClient } from '../MikotoClient';
import { User } from '../api.gen';
import { ZSchema } from '../helpers/ZSchema';
import { Manager } from './base';

export class MikotoUser extends ZSchema(User) {
  client!: MikotoClient;

  constructor(base: User, client: MikotoClient) {
    super(base);
    this.client = ref(client);
    return proxy(this);
  }
}

export class UserManager extends Manager {
  constructor(public client: MikotoClient) {
    super(client);
    proxy(this);
  }

  me?: MikotoUser;

  async load() {
    const res = await this.client.rest['user.get']();
    this.me = new MikotoUser(res, this.client);
    return this.me;
  }
}
