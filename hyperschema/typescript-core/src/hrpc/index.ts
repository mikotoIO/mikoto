import { ZodType } from 'zod';

import { HyperRPCEvent } from './event';
import { FnBuilder, HyperRPCFn } from './fn';

export type MetaObject = {
  connId: string;
  authToken?: string;
};

type HyperRPCBaseFn = HyperRPCFn<any, any, any>;
type HyperRPCBaseEvent = HyperRPCEvent<any, any>;
type ServiceFields = HyperRPCService | HyperRPCBaseFn | HyperRPCBaseEvent;

export class HyperRPCService<Ctx = any> {
  path: string = '';
  constructor(
    public hyperRPC: HyperRPC<Ctx>,
    public subservices: Record<string, HyperRPCService>,
    public functions: Record<string, HyperRPCBaseFn>,
    public events: Record<string, HyperRPCBaseEvent>,
  ) {}

  root(path: string = '') {
    // defines the current service as the root.
    // sets the root path for all subservices relative to this service, recursively.
    // remove leading slash
    this.path = path;
    Object.entries(this.subservices).forEach(([name, svc]) => {
      svc.root(path === '' ? name : `${path}/${name}`);
    });
    return this;
  }
}

export class HyperRPC<Context = { $meta: MetaObject }> {
  contextFn: (base: { $meta: MetaObject }) => Context | Promise<Context> =
    async () => ({}) as any;

  context<T>(
    fn: (base: { $meta: MetaObject }) => T | Promise<T>,
  ): HyperRPC<Context & T> {
    this.contextFn = fn as any;
    return this as any;
  }

  fn<I extends Record<string, ZodType>, O extends ZodType>(
    input: I,
    output: O,
  ) {
    return new FnBuilder<I, O, Context>(input, output);
  }

  event<T extends ZodType>(event: T) {
    return new HyperRPCEvent<Context, T>(event);
  }

  service(handlers: { [key: string]: ServiceFields }) {
    const subservices: Record<string, HyperRPCService> = {};
    const functions: Record<string, HyperRPCBaseFn> = {};
    const events: Record<string, HyperRPCBaseEvent> = {};

    Object.entries(handlers).forEach(([name, p]) => {
      if (p instanceof HyperRPCService) {
        subservices[name] = p;
      } else if (p instanceof HyperRPCFn) {
        functions[name] = p;
      } else if (p instanceof HyperRPCEvent) {
        events[name] = p;
      }
    });
    return new HyperRPCService(this, subservices, functions, events);
  }
}
