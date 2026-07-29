import Joi, { Schema } from 'joi';
import httpStatus from 'http-status';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';

export type ValidationSchema = Partial<Record<'params' | 'query' | 'body', Schema>>;

const validate =
  (schema: ValidationSchema): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req as unknown as Record<string, unknown>, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
    Object.assign(req, value);
    return next();
  };

export default validate;
