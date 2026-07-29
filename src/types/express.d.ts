import { User as PrismaUser } from '@prisma/client';

/**
 * Augment Express so that `req.user` (populated by the passport JWT strategy /
 * auth middleware) is strongly typed as our Prisma user, and `res.locals`
 * carries the error message written by the error handler.
 */
declare global {
  namespace Express {
    // passport merges `User` into `Request.user`; make it our Prisma user.
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends PrismaUser {}

    interface Locals {
      errorMessage?: string;
    }
  }
}

export {};
