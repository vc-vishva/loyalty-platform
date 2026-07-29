import { z } from 'zod';

/**
 * Reusable Zod field schemas shared across request validations.
 */
export const password = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'password must contain at least 1 letter')
  .regex(/\d/, 'password must contain at least 1 number');

export const uuid = z.string().uuid('must be a valid uuid');

export default {
  password,
  uuid,
};
