export type WithSerializedDates<Type> = {
  [Key in keyof Type]: Type[Key] extends Date
    ? string
    : Type[Key] extends Date | null
      ? string | null
      : Type[Key] extends Date | undefined
        ? string | undefined
        : Type[Key] extends Date | null | undefined
          ? string | null | undefined
          : Type[Key] extends Record<PropertyKey, unknown>
            ? WithSerializedDates<Type[Key]>
            : Type[Key] extends Record<PropertyKey, unknown> | null
              ? WithSerializedDates<Type[Key]> | null
              : Type[Key] extends Record<PropertyKey, unknown>[]
                ? WithSerializedDates<Type[Key][number]>[]
                : Type[Key];
};

// "serialize" dates lmao
// only use at the end of a function
export function serializeDates<T>(input: T): WithSerializedDates<T> {
  return input as any;
}
