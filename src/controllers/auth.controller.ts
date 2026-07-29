import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { authService, userService, tokenService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { excludePassword } from '../utils/user.util.js';
import { successMessages } from '../config/messages.js';
import { RegisterBody, LoginBody } from '../types/auth.type.js';

export const register = catchAsync(async (req, res) => {
  const { businessId, name, email, password, role } = req.body as RegisterBody;
  const user = await userService.createUser({ businessId, name, email, password, role });
  const token = tokenService.generateAccessToken(user);
  sendResponse(res, httpStatus.CREATED, successMessages.USER_SIGNUP, { user: excludePassword(user), token });
});

export const login = catchAsync(async (req, res) => {
  const { businessId, email, password } = req.body as LoginBody;
  const user = await authService.loginUserWithEmailAndPassword(businessId, email, password);
  const token = tokenService.generateAccessToken(user);
  sendResponse(res, httpStatus.OK, successMessages.USER_LOGGED_IN, { user: excludePassword(user), token });
});

export default {
  register,
  login,
};
