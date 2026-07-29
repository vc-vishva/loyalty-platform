import { z } from 'zod';
import { password, uuid } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const createUser = {
  body: z.object({
    businessId: uuid,
    name: z.string().min(1, `name ${validationMessages.REQUIRED}`),
    email: z.email(validationMessages.INVALID_EMAIL),
    password,
    role: z.enum(['admin', 'customer'], { error: validationMessages.INVALID_ROLE }),
  }),
};

export default {
  createUser,
};
