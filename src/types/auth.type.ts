import { Role } from '@prisma/client';

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
