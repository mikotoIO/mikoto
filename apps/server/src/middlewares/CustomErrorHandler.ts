import {
  Middleware,
  ExpressErrorMiddlewareInterface,
} from 'routing-controllers';
import { Service } from 'typedi';
import { logger } from '../functions/logger';

@Service()
@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: Error) {
    logger.error('endpoint error', error);
  }
}
