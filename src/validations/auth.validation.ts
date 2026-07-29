import { z } from 'zod';
import { password } from './custom.validation.js';

export const register = {
  body: z.object({
    email: z.email(),
    password,
    name: z.string().min(1, 'name is required'),
  }),
};

export const login = {
  body: z.object({
    email: z.string().min(1, 'email is required'),
    password: z.string().min(1, 'password is required'),
  }),
};

export const logout = {
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
};

export default {
  register,
  login,
  logout,
};
