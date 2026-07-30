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

/** An ISO 8601 datetime string (e.g. 2026-08-01T09:00:00.000Z). */
export const isoDateTime = z.iso.datetime({ message: validationMessages.INVALID_DATETIME });

/** A calendar date string YYYY-MM-DD, used for availability queries. */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, validationMessages.INVALID_DATE);

export default {
  password,
  uuid,
  isoDateTime,
  dateString,
};
