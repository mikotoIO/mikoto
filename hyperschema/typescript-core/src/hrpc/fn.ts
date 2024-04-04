import { ZodType, z } from 'zod';

export type InferInput<T extends Record<string, ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

export type SchemaFn<
  I extends Record<string, ZodType>,
  O extends ZodType,
  C,
> = (input: InferInput<I> & C) => Promise<z.input<O>>;

// actual defs
export class FnBuilder<
  I extends Record<string, ZodType>,
  O extends ZodType,
  C,
  M = InferInput<I> & C,
> {
  constructor(
    public inputSchema: I,
    public outputSchema: O,
  ) {}

  // I've given up trying to type this
  middlewares: ((x: any) => Promise<any>)[] = [];

  use<N>(fn: (input: M) => Promise<N>): FnBuilder<I, O, C, N> {
    this.middlewares.push(fn);
    return this as any;
  }

  do(fn: (input: M) => Promise<z.input<O>>) {
    return new HyperRPCFn(
      this.inputSchema,
      this.outputSchema,
      fn,
      this.middlewares,
    );
  }
}

export class HyperRPCFn<
  I extends Record<string, ZodType>,
  O extends ZodType,
  C = {},
> {
  private inputValidator: ZodType<InferInput<I>>;

  constructor(
    public input: I,
    public output: O,
    public fn: SchemaFn<I, O, C>,
    public middlewares: ((x: any) => Promise<any>)[] = [],
  ) {
    this.inputValidator = z.object(input);
  }

  async call(ctx: C, args: unknown): Promise<z.input<O>> {
    const parsedArgs = this.inputValidator.parse(args);
    const res = await this.middlewares.reduce(
      async (acc: any, fn) => await fn(await acc),
      Object.assign(parsedArgs, ctx),
    );
    return this.output.parse(await this.fn(res));
  }
}
