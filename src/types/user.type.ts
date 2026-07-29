import { Role } from '@prisma/client';

/** Request-body types for the user module. */

export interface CreateUserBody {
  businessId: string;
  name: string;
  email: string;
  password: string;
  role?: Role;
}
