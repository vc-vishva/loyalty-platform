import { z } from 'zod';
import { password } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const register = {
  body: z.object({
    name: z.string().min(1, `name ${validationMessages.REQUIRED}`),
    email: z.email(validationMessages.INVALID_EMAIL),
    password,
    role: z.enum(['member', 'admin'], { error: validationMessages.INVALID_ROLE }).optional(),
  }),
};

export const login = {
  body: z.object({
    email: z.email(validationMessages.INVALID_EMAIL),
    password: z.string().min(1, `password ${validationMessages.REQUIRED}`),
  }),
};

export const refresh = {
  body: z.object({
    refreshToken: z.string().min(1, `refreshToken ${validationMessages.REQUIRED}`),
  }),
};

export const logout = {
  body: z.object({
    refreshToken: z.string().min(1, `refreshToken ${validationMessages.REQUIRED}`),
  }),
};

export default {
  register,
  login,
  refresh,
  logout,
};
