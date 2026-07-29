import httpStatus from 'http-status';
import { User } from '@prisma/client';
import * as tokenService from './token.service.js';
import * as userService from './user.service.js';
import { AuthTokens } from './token.service.js';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';
import { errorMessages } from '../config/messages.js';

/**
 * Login with email and password.
 */
export const loginUserWithEmailAndPassword = async (
  businessId: string,
  email: string,
  password: string
): Promise<User> => {
  const user = await userService.getUserByEmail(businessId, email);
  if (!user || !(await userService.isPasswordMatch(password, user))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INCORRECT_DETAILS);
  }
  return user;
};

/**
 * Logout by removing the stored refresh token.
 */
export const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenDoc = await prisma.token.findFirst({
    where: { token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false },
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.NOT_FOUND);
  }
  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
};

/**
 * Refresh auth tokens.
 */
export const refreshAuth = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.USER_UNAUTHORIZED);
  }
};

export default {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
};
