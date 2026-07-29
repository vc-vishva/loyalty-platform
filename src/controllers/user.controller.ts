import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { userService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { excludePassword } from '../utils/user.util.js';
import { successMessages } from '../config/messages.js';
import { CreateUserBody } from '../types/user.type.js';

export const createUser = catchAsync(async (req, res) => {
  const { businessId, name, email, password, role } = req.body as CreateUserBody;
  const user = await userService.createUser({ businessId, name, email, password, role });
  sendResponse(res, httpStatus.CREATED, successMessages.SUCCESSFULLY_CREATED, excludePassword(user));
});

export default {
  createUser,
};
