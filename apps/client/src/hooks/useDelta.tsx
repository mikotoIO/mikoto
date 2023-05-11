import { EmitterEvents } from 'mikotojs';
import React, { useState, useEffect } from 'react';
import { RecoilState, useRecoilState } from 'recoil';
import TypedEmitter from 'typed-emitter';

import { useMikotoDispatch } from '../redux';
import { DeltaReducerActions } from '../redux/mikoto';

interface ObjectWithId {
  id: string;
}

function getMutationFunctions<T extends ObjectWithId>(
  setData: React.Dispatch<React.SetStateAction<T[]>>,
) {
  return {
    createFn: (x: T) => {
      setData((xs) => [...xs, x]);
    },
    updateFn: (x: T) => {
      setData((xs) => xs.map((orig) => (x.id === orig.id ? x : orig)));
    },
    deleteFn: (id: string) => {
      setData((xs) => xs.filter((x) => x.id !== id));
    },
  };
}

export function useDeltaNext<T extends ObjectWithId>(
  emitter: TypedEmitter<EmitterEvents<T>>,
  parentId: string,
  fetch: () => Promise<T[]>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch().then((d) => {
      setLoading(false);
      setData(d);
    });
  }, deps);

  const { createFn, updateFn, deleteFn } = getMutationFunctions(setData);

  useEffect(() => {
    emitter.on(`create/${parentId}`, createFn);
    emitter.on(`update/${parentId}`, updateFn);
    emitter.on(`delete/${parentId}`, deleteFn);
    return () => {
      emitter.off(`create/${parentId}`, createFn);
      emitter.off(`update/${parentId}`, updateFn);
      emitter.off(`delete/${parentId}`, deleteFn);
    };
  }, deps);

  return {
    data,
    loading,
  };
}

export function useDeltaWithRedux<T extends ObjectWithId>(
  reduxActions: DeltaReducerActions<T>,
  emitter: TypedEmitter<EmitterEvents<T>>,
  parentId: string,
  fetch: () => Promise<T[]>,
  deps: React.DependencyList,
) {
  const dispatch = useMikotoDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch().then((d) => {
      setLoading(false);
      dispatch(reduxActions.initialize(d));
    });
  }, deps);

  const createFn = (x: T) => {
    dispatch(reduxActions.create(x));
  };
  const updateFn = (x: T) => {
    dispatch(reduxActions.update(x));
  };
  const deleteFn = (id: string) => {
    dispatch(reduxActions.delete(id));
  };

  useEffect(() => {
    emitter.on(`create/${parentId}`, createFn);
    emitter.on(`update/${parentId}`, updateFn);
    emitter.on(`delete/${parentId}`, deleteFn);
    return () => {
      emitter.off(`create/${parentId}`, createFn);
      emitter.off(`update/${parentId}`, updateFn);
      emitter.off(`delete/${parentId}`, deleteFn);
    };
  }, deps);

  return {
    loading,
  };
}
