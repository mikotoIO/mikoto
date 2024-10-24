import EventEmitter from 'events';
import WebSocket from 'isomorphic-ws';

import type { WebsocketEventEmitter, websocketCommands } from './api.gen';

export interface WebsocketApiOptions {
  url: string;
}

type WebsocketCommands = typeof websocketCommands;

export class WebsocketApi extends (EventEmitter as new () => WebsocketEventEmitter) {
  ws: WebSocket;
  constructor(options: WebsocketApiOptions) {
    super();
    this.ws = new WebSocket(options.url);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse((event as any).data);
      this.emit(msg.op, msg.data);
    };

    this.ws.onclose = (ev) => {
      console.log('Websocket closed', ev);
    };
  }

  send<K extends keyof WebsocketCommands>(op: K, data: WebsocketCommands[K]) {
    this.ws.send(
      JSON.stringify({
        op,
        data,
      }),
    );
  }

  close() {
    this.ws.close();
  }
}
