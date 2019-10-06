import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/http.exception';
import logger from '../utils/logger';

function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
  logger.error(error);
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  const code = error.code || 'unknown_error';
  response
    .status(status)
    .send({
      status,
      code,
      message
    })
    .end();
}

export default errorMiddleware;
