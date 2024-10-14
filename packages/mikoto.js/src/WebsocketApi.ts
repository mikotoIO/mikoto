import EventEmitter from 'events';
import WebSocket from 'isomorphic-ws';

import type { WebsocketEventEmitter } from './api.gen';

export interface WebsocketApiOptions {
  url: string;
}

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
}
