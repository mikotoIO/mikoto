import { NotFoundError } from 'routing-controllers';
import { z } from 'zod';

import { h } from '../core';
import { User } from '../models';

export const UserUpdateOptions = z.object({
  name: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const UserService = h.service({
  me: h.fn({}, User).do(async ({ $p, state }) => {
    const user = await $p.user.findUnique({
      where: { id: state.user.id },
    });

    if (!user) throw new NotFoundError();
    return user;
  }),

  update: h
    .fn({ options: UserUpdateOptions }, User)
    .do(async ({ $p, state, options }) => {
      const user = await $p.user.update({
        where: { id: state.user.id },
        data: {
          name: options.name ?? undefined,
          avatar: options.avatar
            ? new URL(options.avatar).pathname.substring(1)
            : undefined,
        },
      });
      return user;
    }),

  onCreate: h.event(User).emitter((emit, { $r }) => {
    $r.on('createUser', emit);
  }),

  onUpdate: h.event(User).emitter((emit, { $r }) => {
    $r.on('updateUser', emit);
  }),

  onDelete: h.event(User).emitter((emit, { $r }) => {
    $r.on('deleteUser', emit);
  }),
});
