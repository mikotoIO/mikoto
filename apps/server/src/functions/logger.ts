import { WinstonTransport as AxiomTransport } from '@axiomhq/axiom-node';
import winston, { format } from 'winston';
import type WinstonTransport from 'winston-transport';

import { env } from '../env';

const transports: WinstonTransport[] = [
  new winston.transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  }),
];

if (env.AXIOM_TOKEN) {
  transports.push(
    new AxiomTransport({
      token: env.AXIOM_TOKEN,
      format: format.json(),
    }),
  );
}

export const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.colorize(), format.simple()),
  transports,
});
