import { prisma } from '../../functions/prisma';
import { h } from '../core';
import { Relation } from '../models';

export const RelationService = h.service({
  list: h.fn({}, Relation.array()).do(async ({ state }) => {
    const relationships = await prisma.relationship.findMany({
      where: { userId: state.user.id },
    });

    return relationships;
  }),
});
