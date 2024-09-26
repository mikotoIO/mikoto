import EventEmitter from "events";
import type { WebsocketEventEmitter } from "./api.gen";

import WebSocket from "isomorphic-ws";

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
	}
}
