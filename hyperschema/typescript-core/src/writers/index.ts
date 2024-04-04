import { writeTypeScriptClient } from '../generator';
import { writeHyperschema } from '../reflector';

// Writers write the Hyperschema defintions to a file (or any other output)
export interface HyperschemaWriter {
  write(hs: any): Promise<void>;
}

export class JSONWriter implements HyperschemaWriter {
  constructor(public path: string) {}

  async write(hs: any) {
    writeHyperschema(this.path, hs);
  }
}

export class TypeScriptWriter implements HyperschemaWriter {
  constructor(public path: string) {}

  async write(hs: any) {
    writeTypeScriptClient(this.path, hs);
  }
}
