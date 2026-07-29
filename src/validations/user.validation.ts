import { z } from 'zod';
import { password } from './custom.validation.js';

export const createUser = {
  body: z.object({
    email: z.email(),
    password,
    name: z.string().min(1, 'name is required'),
    role: z.enum(['user', 'admin']),
  }),
};

export default {
  createUser,
};
