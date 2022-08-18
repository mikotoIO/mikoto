export function patch<T>(base: T, patches: Partial<T>) {
  Object.keys(patches).forEach((key) => {
    (base as any)[key] = (patches as any)[key];
  });
}
