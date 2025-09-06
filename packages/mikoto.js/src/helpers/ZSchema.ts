import type { z } from 'zod';

export interface ZSchemaInterface<
  T extends z.ZodRawShape,
  TObject = z.ZodObject<T>,
> {
  new (data: z.infer<z.ZodObject<T>>): z.infer<z.ZodObject<T>>;

  schema: TObject;

  parse<
    TFinal extends new (data: z.infer<z.ZodObject<T>>) => InstanceType<TFinal>,
  >(
    this: TFinal,
    value: z.infer<z.ZodObject<T>>,
  ): InstanceType<TFinal>;
}

export function ZSchema<
  T extends z.ZodRawShape,
  Type = ZSchemaInterface<T> & z.infer<z.ZodObject<T>>,
>(schema: z.ZodObject<T>): Type {
  const res = class {
    static schema = schema;
    constructor(value: z.infer<z.ZodObject<T>>) {
      Object.assign(this, schema.parse(value));
    }
    static parse<T extends typeof res>(this: T, value: unknown): any {
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      const parsed = new this(schema.parse(value)) as any;
      return parsed;
    }
  };
  return res as typeof res & any;
}
