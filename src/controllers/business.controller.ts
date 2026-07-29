import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { businessService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreateBusinessBody, BusinessIdParams } from '../types/business.type.js';

export const createBusiness = catchAsync(async (req, res) => {
  const body = req.body as CreateBusinessBody;
  const business = await businessService.createBusiness(body);
  sendResponse(res, httpStatus.CREATED, successMessages.BUSINESS_CREATED, business);
});

export const getBusiness = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as BusinessIdParams;
  const business = await businessService.getBusinessById(id);
  sendResponse(res, httpStatus.OK, successMessages.BUSINESS_FETCHED, business);
});

export default {
  createBusiness,
  getBusiness,
};
