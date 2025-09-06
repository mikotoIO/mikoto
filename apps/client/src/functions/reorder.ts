import { produce } from 'immer';

/**
 * Move an element in an array from one index to another.
 * @param arr The array to reorder. This array will not be mutated.
 * @param from The index to move from
 * @param to The index to move to
 * @returns A new array with the element moved
 */
export function reorder<T>(arr: T[], from: number, to: number) {
  return produce(arr, (draft) => {
    const [removed] = draft.splice(from, 1);
    draft.splice(to, 0, removed);
  });
}
