import React, { useState, useEffect } from 'react';
import { DeltaEngine } from '../api/engines/DeltaEngine';
import { DeltaInstance } from '../api/instances/DeltaInstance';

interface ObjectWithId {
  id: string;
}

export function useDelta<T extends ObjectWithId>(
  engine: DeltaEngine<T>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    engine.fetch().then((d) => {
      setLoading(false);
      setData(d);
    });
  }, deps);

  const refetch = async () => {
    const xs = await engine.fetch();
    setData(xs);
  };

  const createFn = (x: T) => {
    setData((xs) => [...xs, x]);
  };

  const updateFn = (x: T) => {
    setData((xs) => xs.map((orig) => (x.id === orig.id ? x : orig)));
  };

  const deleteFn = (y: T) => {
    setData((xs) => xs.filter((x) => x.id !== y.id));
  };

  useEffect(() => {
    engine.on('create', createFn);
    engine.on('update', updateFn);
    engine.on('delete', deleteFn);
    return () => {
      engine.off('create', createFn);
      engine.off('update', updateFn);
      engine.off('delete', deleteFn);
    };
  }, deps);

  return {
    data,
    loading,
    refetch,
  };
}

export function useDeltaInstance<T>(
  instance: DeltaInstance<T>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    instance.fetch().then((x) => {
      setLoading(false);
      setData(x);
    });
  }, deps);

  const updateFn = (x: T) => {
    setData(x);
  };

  useEffect(() => {
    instance.on('update', updateFn);
    return () => {
      instance.off('update', updateFn);
    };
  }, deps);

  return {
    data,
    loading,
  };
}
