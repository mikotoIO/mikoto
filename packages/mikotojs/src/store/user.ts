import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { User } from '../schema';
import { normalizedAssign } from './base';

export class ClientUser implements User {
  id!: string;
  name!: string;
  avatar!: string | null;
  category!: string | null;

  constructor(public client: MikotoClient, data: User) {
    normalizedAssign(this, data, {});
    makeAutoObservable(this, { id: false, client: false });
  }
}
