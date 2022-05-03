import { Socket } from 'socket.io-client';
import React, { useEffect } from 'react';

export function useSocketIO<T>(
  io: Socket,
  ev: string,
  fn: (data: T) => void,
  deps?: React.DependencyList | undefined,
) {
  useEffect(() => {
    io.on(ev, fn);
    return () => {
      io.off(ev, fn);
    };
  }, [ev, fn, deps, io]);
}
