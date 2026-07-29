import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { authService, userService, tokenService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { excludePassword } from '../utils/user.util.js';
import { successMessages } from '../config/messages.js';

export const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendResponse(res, httpStatus.CREATED, successMessages.USER_SIGNUP, excludePassword(user));
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  sendResponse(res, httpStatus.OK, successMessages.USER_LOGGED_IN, { user: excludePassword(user), tokens });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  await authService.logout(refreshToken);
  sendResponse(res, httpStatus.OK, successMessages.USER_LOGGED_OUT, {});
});

export default {
  register,
  login,
  logout,
};
