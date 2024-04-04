import { WebSocketServer } from 'ws';

import { HyperRPCService } from '..';
import { processError } from './logic';

export function hostHyperRPC(service: HyperRPCService) {
  const wss = new WebSocketServer({
    port: 8080,
  });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const { op, data, nonce } = JSON.parse(message.toString('utf-8'));
      try {
        const path = op.split('/') as string[];
        const functionName = path.pop()!;
        const endpointSvc = path.reduce(
          (acc, x) => acc.subservices[x],
          service,
        );

        const fn = endpointSvc.functions[functionName];
        fn.call({}, data)
          .then((ok) => ws.send(JSON.stringify({ ok, nonce })))
          .catch((err) => ws.send(JSON.stringify({ err: processError(err) })));
      } catch (err) {
        ws.send(JSON.stringify({ err: processError(err) }));
      }
    });
  });
}
