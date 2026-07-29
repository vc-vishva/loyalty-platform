import { ZodType } from 'zod';
import httpStatus from 'http-status';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import ApiError from '../utils/ApiError.js';

export type ValidationSchema = Partial<Record<'params' | 'query' | 'body', ZodType>>;

const PARTS = ['params', 'query', 'body'] as const;

const validate =
  (schema: ValidationSchema): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    for (const part of PARTS) {
      const partSchema = schema[part];
      if (!partSchema) {
        continue;
      }
      const result = partSchema.safeParse(req[part]);
      if (!result.success) {
        const message = result.error.issues
          .map((issue) => `${issue.path.join('.') || part}: ${issue.message}`)
          .join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, message));
      }
      // In Express 5 `req.query`/`req.params` are read-only getters, so only the
      // parsed body is written back; params/query are validated but not reassigned.
      if (part === 'body') {
        req.body = result.data;
      }
    }
    return next();
  };

export default validate;
