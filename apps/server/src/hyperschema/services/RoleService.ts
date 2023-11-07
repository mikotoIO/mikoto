import { permissions } from '@mikoto-io/permcheck';
import { z } from 'zod';

import { prisma } from '../../functions/prisma';
import { h } from '../core';
import { requireSpacePerm } from '../middlewares';
import { Role } from '../models';

export const RoleEditPayload = z.object({
  name: z.nullable(z.string()),
  color: z.nullable(z.string()),
  permissions: z.nullable(z.string()),
  position: z.nullable(z.number().int()),
});

export const RoleService = h.service({
  create: h
    .fn(
      {
        spaceId: z.string(),
        name: z.string(),
      },
      Role,
    )
    .use(requireSpacePerm(permissions.manageRoles))
    .do(async ({ spaceId, name, $r }) => {
      const role = await prisma.role.create({
        data: {
          spaceId,
          position: 0,
          permissions: '0',
          name,
        },
      });
      await $r.pub(`space:${spaceId}`, 'createRole', role);
      return role;
    }),

  edit: h
    .fn(
      {
        spaceId: z.string(),
        roleId: z.string(),
        options: RoleEditPayload,
      },
      Role,
    )
    .use(requireSpacePerm(permissions.manageRoles))
    .do(async ({ roleId, options, $r }) => {
      const role = await prisma.role.update({
        where: { id: roleId },
        data: {
          name: options.name ?? undefined,
          permissions: options.permissions ?? undefined,
          position: options.position ?? undefined,
          color: options.color ?? undefined,
        },
      });
      await $r.pub(`space:${role.spaceId}`, 'updateRole', role);
      return role;
    }),

  delete: h
    .fn({ spaceId: z.string(), roleId: z.string() }, Role)
    .use(requireSpacePerm(permissions.manageRoles))
    .do(async ({ roleId, spaceId, $r }) => {
      const role = await prisma.role.delete({
        where: { id: roleId },
      });
      await $r.pub(`space:${spaceId}`, 'deleteRole', role);
      return role;
    }),

  onCreate: h.event(Role).emitter((emit, { $r }) => {
    $r.on('createRole', emit);
  }),

  onUpdate: h.event(Role).emitter((emit, { $r }) => {
    $r.on('updateRole', emit);
  }),

  onDelete: h.event(Role).emitter((emit, { $r }) => {
    $r.on('deleteRole', emit);
  }),
});
