import { Role } from '@prisma/client';

/** What the user service needs to create a user. */
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
