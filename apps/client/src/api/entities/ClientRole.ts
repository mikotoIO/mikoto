import { Role } from '../../models';
import type MikotoApi from '../index';

export class ClientRole implements Role {
  id: string;
  name: string;
  color?: string;
  permissions: string;
  position: number;

  constructor(private client: MikotoApi, base: Role) {
    this.id = base.id;
    this.name = base.name;
    this.color = base.color;
    this.permissions = base.permissions;
    this.position = base.position;
  }
}
