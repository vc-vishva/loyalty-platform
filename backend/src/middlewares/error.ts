import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import config from '../config/config.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

interface ErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

const httpStatusMap = httpStatus as unknown as Record<number, string>;

const isPrismaError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError ||
  error instanceof Prisma.PrismaClientValidationError;

export const errorConverter = (err: unknown, _req: Request, _res: Response, next: NextFunction): void => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const hasStatusCode =
      error instanceof Error && 'statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number';
    const statusCode = hasStatusCode
      ? (error as { statusCode: number }).statusCode
      : isPrismaError(error)
      ? httpStatus.BAD_REQUEST
      : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : httpStatusMap[statusCode];
    const stack = error instanceof Error ? error.stack : undefined;
    error = new ApiError(statusCode, message, false, stack);
  }
  next(error);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction): void => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatusMap[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response: ErrorResponse = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

export default {
  errorConverter,
  errorHandler,
};
