import { Role } from '@prisma/client';

/** Request-body types for the user module. */

/** Body accepted by POST /users — businessId comes from the JWT, not the body. */
export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

/** What the user service needs to create a user (tenant added from the caller). */
export interface CreateUserInput extends CreateUserBody {
  businessId: string;
}
