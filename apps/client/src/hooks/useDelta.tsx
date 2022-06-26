import React, { useState } from 'react';
import { DeltaEngine } from '../api/deltaEngine';

interface ObjectWithId {
  id: string;
}

export function useDelta<T extends ObjectWithId>(
  engine: DeltaEngine<T>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    engine.fetch().then((d) => {
      setLoading(false);
      setData(d);
    });
  }, deps);

  const createFn = (x: T) => {
    setData((xs) => [...xs, x]);
  };

  const deleteFn = (y: T) => {
    setData((xs) => xs.filter((x) => x.id !== y.id));
  };

  React.useEffect(() => {
    engine.on('create', createFn);
    engine.on('delete', deleteFn);
    return () => {
      engine.off('create', createFn);
      engine.off('delete', deleteFn);
    };
  }, deps);

  return {
    data,
    loading,
  };
}
