import { useEffect, useRef } from 'react';

export function useInterval(
  callback: () => void,
  delay: number,
  immediate = false,
) {
  const savedCallbackRef = useRef<(() => void) | undefined>(undefined);

  // Remember the latest callback.
  useEffect(() => {
    savedCallbackRef.current = callback;
    if (immediate) {
      callback();
    }
  }, [callback, immediate]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallbackRef.current!();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
