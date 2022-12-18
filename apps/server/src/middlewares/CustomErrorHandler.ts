import express from 'express';
import {
  Middleware,
  ExpressErrorMiddlewareInterface,
  HttpError,
} from 'routing-controllers';
import { Service } from 'typedi';

import { logger } from '../functions/logger';

@Service()
@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(
    error: Error,
    request: express.Request,
    response: express.Response,
    next: () => void,
  ) {
    logger.error('endpoint error', error);
    response.status(error instanceof HttpError ? error.httpCode : 500).json({
      name: error.name,
      message: error.message,
    });
    next();
  }
}
