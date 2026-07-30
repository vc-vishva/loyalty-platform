import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { authService, userService, tokenService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { excludePassword } from '../utils/user.util.js';
import { successMessages } from '../config/messages.js';
import { RegisterBody, LoginBody, RefreshBody } from '../types/auth.type.js';

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body as RegisterBody;
  const user = await userService.createUser({ name, email, password, role });
  const tokens = await tokenService.generateAuthTokens(user);
  sendResponse(res, httpStatus.CREATED, successMessages.USER_SIGNUP, {
    user: excludePassword(user),
    tokens,
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body as LoginBody;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  sendResponse(res, httpStatus.OK, successMessages.USER_LOGGED_IN, {
    user: excludePassword(user),
    tokens,
  });
});

export const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body as RefreshBody;
  const tokens = await tokenService.rotateRefreshToken(refreshToken);
  sendResponse(res, httpStatus.OK, successMessages.TOKEN_REFRESHED, { tokens });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body as RefreshBody;
  await tokenService.revokeRefreshToken(refreshToken);
  sendResponse(res, httpStatus.OK, successMessages.USER_LOGGED_OUT);
});

export default {
  register,
  login,
  refresh,
  logout,
};
