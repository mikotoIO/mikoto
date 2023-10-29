import { h } from '../core';
import { Relation } from '../models';

export const RelationService = h.service({
  list: h.fn({}, Relation.array()).do(async ({ state, $p }) => {
    const relationships = await $p.relationship.findMany({
      where: { userId: state.user.id },
    });

    return relationships;
  }),
});
