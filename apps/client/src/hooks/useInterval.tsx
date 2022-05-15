import { useEffect, useRef } from 'react';

export function useInterval(
  callback: () => void,
  delay: number,
  immediate = false,
) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
    if (immediate) {
      callback();
    }
  }, [callback, immediate]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current!();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
