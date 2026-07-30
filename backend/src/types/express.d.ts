import { AuthContext } from './auth.type.js';

/**
 * Augment Express so that `req.auth` (populated by the authenticate middleware
 * from the verified JWT) is strongly typed, and `res.locals` carries the error
 * message written by the error handler.
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }

    interface Locals {
      errorMessage?: string;
    }
  }
}

export {};
