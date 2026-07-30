import { z } from 'zod';
import { validationMessages } from '../config/messages.js';

/**
 * Reusable Zod field schemas shared across request validations.
 */
export const password = z
  .string()
  .min(8, validationMessages.PASSWORD_MIN)
  .regex(/[a-zA-Z]/, validationMessages.PASSWORD_LETTER)
  .regex(/\d/, validationMessages.PASSWORD_NUMBER);

export const uuid = z.uuid(validationMessages.INVALID_UUID);

export default {
  password,
  uuid,
};
