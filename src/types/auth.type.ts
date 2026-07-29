import { Role } from '@prisma/client';

/** The authenticated context derived from the JWT and attached to `req.auth`. */
export interface AuthContext {
  userId: string;
  businessId: string;
  role: Role;
}

/** Request-body types for the auth module. */

export interface RegisterBody {
  businessId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginBody {
  businessId: string;
  email: string;
  password: string;
}

export interface LogoutBody {
  refreshToken: string;
}
