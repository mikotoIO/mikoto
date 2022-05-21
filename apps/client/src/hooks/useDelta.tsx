import React, { useState } from 'react';

interface ObjectWithId {
  id: string;
}

interface UseDelta<T extends ObjectWithId> {
  initializer(): Promise<T[]>;
  predicate(x: T): boolean;
}

export function useDelta<T extends ObjectWithId>(
  { initializer, predicate }: UseDelta<T>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T[]>([]);

  React.useEffect(() => {
    initializer().then(setData);
  }, deps);

  return {
    data,
    setData,
    create(x: T) {
      if (predicate(x)) {
        setData((xs) => [...xs, x]);
      }
    },
    delete(d: T) {
      if (predicate(d)) {
        setData((xs) => xs.filter((x) => x.id !== d.id));
      }
    },
  };
}
