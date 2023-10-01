import { permissions } from '@mikoto-io/permcheck';
import { z } from 'zod';

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
    .do(async ({ spaceId, name, $p, $r }) => {
      const role = await $p.role.create({
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
    .do(async ({ roleId, options, $p, $r }) => {
      const role = await $p.role.update({
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
    .do(async ({ roleId, spaceId, $p, $r }) => {
      const role = await $p.role.delete({
        where: { id: roleId },
      });
      await $r.pub(`space:${spaceId}`, 'deleteRole', role);
      return role;
    }),
});
