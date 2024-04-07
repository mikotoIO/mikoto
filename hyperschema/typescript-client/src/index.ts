import { Socket, io } from 'socket.io-client';

export interface ServiceOptions {
  url: string;
  authToken?: string;
}

export interface HyperschemaClient {
  call(path: string, input: any): Promise<any>;
  on(path: string, cb: (x: any) => void): () => void;
  disconnect(): void;

  onReady(cb: () => void): void;
  onConnect(cb: () => void): void;
  onDisconnect(cb: () => void): void;
}

export abstract class RootService {
  protected abstract client: HyperschemaClient;

  onReady(cb: () => void) {
    this.client.onReady(cb);
  }

  onConnect(cb: () => void) {
    this.client.onConnect(cb);
  }

  onDisconnect(cb: () => void) {
    this.client.onDisconnect(cb);
  }
}

export class SocketIOClientTransport implements HyperschemaClient {
  socket: Socket;
  constructor(options: ServiceOptions) {
    this.socket = io(options.url, {
      auth: { token: options.authToken },
    });
  }

  async call(path: string, input: any): Promise<any> {
    const res = await this.socket.emitWithAck(path, input);
    if (res.err) {
      throw new Error(res.err.message);
    }
    return res.ok;
  }

  on(path: string, cb: (x: any) => void): () => void {
    this.socket.on(path, cb);
    return () => {
      this.socket.off(path, cb);
    };
  }

  disconnect(): void {
    // as soon as they disconnect, they become eligible for garbage collection
    this.socket.disconnect();
  }

  onReady(cb: () => void): void {
    this.socket.once('connect', () => {
      this.socket.once('ready', cb);
    });
  }

  onConnect(cb: () => void): void {
    this.socket.on('connect', cb);
  }

  onDisconnect(cb: () => void): void {
    this.socket.on('disconnect', cb);
  }
}

interface CreateClientOptions {
  url: string;
  authToken?: string;
  onReady?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

function createClient() {}
