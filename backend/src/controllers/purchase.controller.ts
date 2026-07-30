import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { getAuth } from '../utils/auth.util.js';
import { purchaseService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreatePurchaseBody, PurchaseIdParams } from '../types/purchase.type.js';

export const createPurchase = catchAsync(async (req, res) => {
  const { businessId, userId } = getAuth(req);
  const { productId, quantity } = req.body as CreatePurchaseBody;
  const purchase = await purchaseService.createPurchase(businessId, userId, productId, quantity);
  sendResponse(res, httpStatus.CREATED, successMessages.PURCHASE_CREATED, purchase);
});

export const getMyPurchases = catchAsync(async (req, res) => {
  const { businessId, userId } = getAuth(req);
  const purchases = await purchaseService.getMyPurchases(businessId, userId);
  sendResponse(res, httpStatus.OK, successMessages.PURCHASE_LIST_FETCHED, purchases);
});

export const getPurchase = catchAsync(async (req, res) => {
  const { businessId, userId } = getAuth(req);
  const { id } = req.params as unknown as PurchaseIdParams;
  const purchase = await purchaseService.getPurchaseById(businessId, userId, id);
  sendResponse(res, httpStatus.OK, successMessages.PURCHASE_FETCHED, purchase);
});

export default {
  createPurchase,
  getMyPurchases,
  getPurchase,
};
