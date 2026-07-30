import httpStatus from 'http-status';
import { User } from '@prisma/client';
import * as userService from './user.service.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';

/**
 * Login with email and password.
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await userService.isPasswordMatch(password, user))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INCORRECT_DETAILS);
  }
  return user;
};

export default {
  loginUserWithEmailAndPassword,
};
