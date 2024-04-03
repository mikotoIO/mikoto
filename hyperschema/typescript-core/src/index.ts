import { HyperRPCService } from './hrpc';
import { AbstractTransportEngine } from './hrpc/transport/logic';
import { HyperschemaWriter } from './writers';

export * from './reflector';
export * from './hrpc';
export * from './hrpc/transport/socketio';
export * from './errors';
export * from './generator';
export * from './writers';
export * from './types';

export interface HyperschemaServerOptions {
  system: any;
  root: HyperRPCService<any>;
  transports?: AbstractTransportEngine[];
  writers?: HyperschemaWriter[];
}

export interface HyperschemaStartOption {
  generate?: boolean;
}

export class HyperschemaServer {
  system: any;
  root: HyperRPCService<any>;
  transports: AbstractTransportEngine[];
  writers: HyperschemaWriter[];

  constructor(options: HyperschemaServerOptions) {
    this.system = options.system;
    this.root = options.root;
    this.transports = options.transports || [];

    this.transports.forEach((t) => t.mount(this.root));
    this.writers = options.writers || [];
  }

  async start(options: HyperschemaStartOption = {}) {
    if (options.generate) {
      await Promise.all(this.writers.map((w) => w.write(this.system)));
    }

    await Promise.all(this.transports.map((t) => t.run()));
  }
}
