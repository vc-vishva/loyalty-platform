import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import { userService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { excludePassword } from '../utils/user.util.js';
import { successMessages, errorMessages } from '../config/messages.js';
import { CreateUserBody } from '../types/user.type.js';

export const createUser = catchAsync(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.UNAUTHORIZED_REQUEST);
  }
  const { name, email, password, role } = req.body as CreateUserBody;
  const user = await userService.createUser({ businessId: req.auth.businessId, name, email, password, role });
  sendResponse(res, httpStatus.CREATED, successMessages.SUCCESSFULLY_CREATED, excludePassword(user));
});

export default {
  createUser,
};
