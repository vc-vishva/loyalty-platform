import httpStatus from 'http-status';
import { User } from '@prisma/client';
import * as tokenService from './token.service.js';
import * as userService from './user.service.js';
import { AuthTokens } from './token.service.js';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';

/**
 * Login with email and password.
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await userService.isPasswordMatch(password, user))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
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
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
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
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

export default {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
};
