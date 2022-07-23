import winston, { format } from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.colorize(), format.simple()),
  transports: [new winston.transports.Console()],
});
