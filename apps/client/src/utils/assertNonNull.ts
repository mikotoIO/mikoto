export function checkNonNull<T>(x: T | null | undefined) {
  if (x === null || x === undefined) {
    throw new Error(
      'null assertion failed; contact mikoto platform developers',
    );
  }
  return x;
}
