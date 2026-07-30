import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Role } from '@prisma/client';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { tokenTypes } from '../config/tokens.js';
import { TokenPayload } from '../services/token.service.js';

/**
 * Authenticate a request from its Bearer JWT. The user id and role are taken
 * straight from the verified ACCESS-token payload — never from the request body
 * or params — and attached to `req.auth`.
 */
export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INVALID_TOKEN));
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    if (payload.type !== tokenTypes.ACCESS) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INVALID_TOKEN));
    }
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new ApiError(httpStatus.UNAUTHORIZED, errorMessages.USER_UNAUTHORIZED));
  }
};

/**
 * Guard a route so only the given role(s) may access it. Must run after
 * `authenticate`.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, errorMessages.UNAUTHORIZED_REQUEST));
    }
    if (!roles.includes(req.auth.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, errorMessages.FORBIDDEN));
    }
    return next();
  };

export default authenticate;
