import { SophonInstance } from '@sophon-js/server';

import { prisma } from '../functions/prisma';
import { MikotoInstance } from './context';
import {
  AbstractRoleService,
  Role,
  RoleEditPayload,
  SophonContext,
} from './schema';

export class RoleService extends AbstractRoleService {
  async create(
    ctx: MikotoInstance,
    spaceId: string,
    name: string,
  ): Promise<Role> {
    const role = await prisma.role.create({
      data: {
        spaceId,
        position: 0,
        permissions: '0',
        name,
      },
    });
    ctx.data.pubsub.pub(`space:${spaceId}`, 'createRole', role);
    return role;
  }

  async edit(
    ctx: MikotoInstance,
    id: string,
    edit: RoleEditPayload,
  ): Promise<Role> {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: edit.name ?? undefined,
        permissions: edit.permissions ?? undefined,
        position: edit.position ?? undefined,
        color: edit.color ?? undefined,
      },
    });
    ctx.data.pubsub.pub(`space:${role.spaceId}`, 'updateRole', role);
    return role;
  }

  async delete(ctx: SophonInstance<SophonContext>, id: string): Promise<void> {
    const role = await prisma.role.delete({
      where: { id },
    });
    ctx.data.pubsub.pub(`space:${role.spaceId}`, 'deleteRole', role);
  }
}
