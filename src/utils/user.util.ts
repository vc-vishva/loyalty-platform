import { User } from '@prisma/client';

/** A user safe to return in API responses (password stripped). */
export type SafeUser = Omit<User, 'password'>;

/**
 * Remove the password hash from a user record before sending it to a client.
 */
export const excludePassword = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export default { excludePassword };
