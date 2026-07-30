import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { getAuth } from '../utils/auth.util.js';
import { rewardService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CustomerIdParams } from '../types/reward.type.js';

export const getMyRewards = catchAsync(async (req, res) => {
  const { businessId, userId } = getAuth(req);
  const rewards = await rewardService.getMyRewards(businessId, userId);
  sendResponse(res, httpStatus.OK, successMessages.REWARD_LIST_FETCHED, rewards);
});

export const getRewardSummary = catchAsync(async (req, res) => {
  const { businessId, userId } = getAuth(req);
  const summary = await rewardService.getRewardSummary(businessId, userId);
  sendResponse(res, httpStatus.OK, successMessages.REWARD_SUMMARY_FETCHED, summary);
});

export const getCustomerRewards = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const { id } = req.params as unknown as CustomerIdParams;
  const rewards = await rewardService.getCustomerRewards(businessId, id);
  sendResponse(res, httpStatus.OK, successMessages.REWARD_LIST_FETCHED, rewards);
});

export default {
  getMyRewards,
  getRewardSummary,
  getCustomerRewards,
};
