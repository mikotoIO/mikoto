import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { User, UserCategory } from '../api.gen';
import { normalizedAssign } from './base';

export class ClientUser implements User {
  id!: string;
  name!: string;
  avatar!: string | null | undefined;
  category!: UserCategory | null | undefined;

  constructor(
    public client: MikotoClient,
    data: User,
  ) {
    normalizedAssign(this, data, {});
    makeAutoObservable(this, { id: false, client: false });
  }
}
