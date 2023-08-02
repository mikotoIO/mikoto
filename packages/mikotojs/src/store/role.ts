import { makeAutoObservable } from 'mobx';

import type { MikotoClient } from '../MikotoClient';
import { Role } from '../schema';
import { normalizedAssign } from './base';

export class ClientRole implements Role {
  id!: string;
  name!: string;
  color!: string | null;
  position!: number;
  permissions!: string;

  constructor(public client: MikotoClient, data: Role) {
    normalizedAssign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}
