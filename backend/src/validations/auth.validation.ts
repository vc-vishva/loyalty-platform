import { z } from 'zod';
import { password, uuid } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const register = {
  body: z.object({
    businessId: uuid,
    name: z.string().min(1, `name ${validationMessages.REQUIRED}`),
    email: z.email(validationMessages.INVALID_EMAIL),
    password,
    role: z.enum(['admin', 'customer'], { error: validationMessages.INVALID_ROLE }),
  }),
};

export const login = {
  body: z.object({
    businessId: uuid,
    email: z.email(validationMessages.INVALID_EMAIL),
    password: z.string().min(1, `password ${validationMessages.REQUIRED}`),
  }),
};

export default {
  register,
  login,
};
