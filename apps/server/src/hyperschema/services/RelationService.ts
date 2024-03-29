import { z } from 'zod';

import { prisma } from '../../functions/prisma';
import { HSContext, h } from '../core';
import { Relation, Space } from '../models';
import { spaceInclude } from '../normalizer';
import { joinSpace } from './SpaceService';

const relationshipInclude = {
  relation: true,
  space: { include: spaceInclude },
};

async function createRelation(
  $r: HSContext['$r'],
  userId: string,
  relationId: string,
) {
  // TODO: do a check on privacy settings
  const space = await prisma.space.create({
    data: {
      name: 'Direct Messages',
      type: 'DM',
      channels: { create: [{ name: 'general', order: 0 }] },
      roles: {
        // @everyone is a superuser in DMs
        create: [{ name: '@everyone', position: -1, permissions: '1' }],
      },
      Relationship: {
        createMany: {
          data: [
            {
              userId,
              relationId,
              state: 'NONE',
            },
            {
              userId: relationId,
              relationId: userId,
              state: 'NONE',
            },
          ],
        },
      },
    },
    include: spaceInclude,
  });
  joinSpace($r, userId, Space.parse(space));
  joinSpace($r, relationId, Space.parse(space));
}

export const RelationService = h.service({
  get: h.fn({ relationId: z.string() }, Relation).do(async ({ relationId }) => {
    const relation = await prisma.relationship.findUnique({
      where: { id: relationId },
      include: relationshipInclude,
    });

    if (relation === null) {
      throw new Error('Relation not found');
    }

    return relation;
  }),

  list: h.fn({}, Relation.array()).do(async ({ state }) => {
    const relationships = await prisma.relationship.findMany({
      where: { userId: state.user.id },
      include: relationshipInclude,
    });

    return relationships;
  }),

  openDm: h
    .fn({ relationId: z.string() }, Relation)
    .do(async ({ relationId, state, $r }) => {
      const relation = await prisma.relationship.findUnique({
        where: {
          userId_relationId: { userId: state.user.id, relationId },
        },
        include: relationshipInclude,
      });
      if (relation === null) {
        await createRelation($r, state.user.id, relationId);
        return await prisma.relationship.findUniqueOrThrow({
          where: {
            userId_relationId: { userId: state.user.id, relationId },
          },
          include: relationshipInclude,
        });
      }

      return relation;
    }),
});
