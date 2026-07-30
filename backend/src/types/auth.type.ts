import { Role } from '@prisma/client';

/** The authenticated context derived from the JWT and attached to `req.auth`. */
export interface AuthContext {
  userId: string;
  role: Role;
}

/** Request-body types for the auth module. */

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

/** A pair of freshly issued tokens. */
export interface AuthTokens {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
}
