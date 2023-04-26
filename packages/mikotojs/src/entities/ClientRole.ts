import type { MikotoClient } from '../MikotoClient';
import { Role } from '../models';

export class ClientRole implements Role {
  id: string;
  name: string;
  color: string | null;
  permissions: string;
  position: number;

  constructor(private client: MikotoClient, base: Role) {
    this.id = base.id;
    this.name = base.name;
    this.color = base.color;
    this.permissions = base.permissions;
    this.position = base.position;
  }
}
