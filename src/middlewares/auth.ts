import passport from 'passport';
import httpStatus from 'http-status';
import { User } from '@prisma/client';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import ApiError from '../utils/ApiError.js';

/**
 * Authenticate the request via the JWT strategy, and optionally require that
 * `req.params.userId` matches the authenticated user's id.
 */
const auth =
  (requireUserIdMatch = false): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const verifyCallback = (err: Error | null, user: User | false, info: unknown): void => {
      if (err || info || !user) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }

      req.user = user;

      if (requireUserIdMatch && req.params.userId !== user.id) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }

      return next();
    };

    passport.authenticate('jwt', { session: false }, verifyCallback)(req, res, next);
  };

export default auth;
