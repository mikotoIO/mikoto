import { h } from '../core';
import { Relation } from '../models';

interface AlphaBetaIdPair {
  alphaId: string;
  betaId: string;
}

function normalizeRelationship<T extends AlphaBetaIdPair>(
  userId: string,
  data: T,
): {
  userId: string;
} & Omit<T, 'alphaId' | 'betaId'> {
  const { alphaId, betaId, ...rest } = data;
  const isAlpha = alphaId === userId;
  return {
    userId: isAlpha ? betaId : alphaId,
    ...rest,
  };
}

export const RelationService = h.service({
  list: h.fn({}, Relation.array()).do(async ({ state, $p }) => {
    const relationships = await $p.relationship.findMany({
      where: {
        OR: [{ alphaId: state.user.id }, { betaId: state.user.id }],
      },
    });
    const w = relationships.map((x) => normalizeRelationship(state.user.id, x));

    return relationships.map((x) => normalizeRelationship(state.user.id, x));
  }),
});
