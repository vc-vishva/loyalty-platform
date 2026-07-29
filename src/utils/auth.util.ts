import httpStatus from 'http-status';
import { Request } from 'express';
import ApiError from './ApiError.js';
import { errorMessages } from '../config/messages.js';
import { AuthContext } from '../types/auth.type.js';

/**
 * Return the authenticated context set by the `authenticate` middleware, or
 * throw 401 if it is missing. Keeps controllers free of repeated guards.
 */
export const getAuth = (req: Request): AuthContext => {
  if (!req.auth) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.UNAUTHORIZED_REQUEST);
  }
  return req.auth;
};

export default getAuth;
