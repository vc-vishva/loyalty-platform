import httpStatus from 'http-status';
import { Purchase } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { enqueueRewardJob } from '../queues/reward.queue.js';
import { invalidateProductListCache } from './product.service.js';

/**
 * Create a purchase for a customer.
 *
 * Steps (the API returns as soon as these complete — reward points are NOT
 * calculated here; a BullMQ job is queued for that):
 *  1. Validate the product exists and belongs to the customer's business.
 *  2. Atomically decrement stock (conditional UPDATE guards against overselling).
 *  3. Create the purchase record.
 *  4. Queue a reward-calculation job and return.
 */
export const createPurchase = async (
  businessId: string,
  customerId: string,
  productId: string,
  quantity: number
): Promise<Purchase> => {
  const purchase = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: productId, businessId } });
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, errorMessages.PRODUCT_NOT_FOUND);
    }

    // Atomic stock decrement: only succeeds if enough stock remains.
    const decremented = await tx.product.updateMany({
      where: { id: productId, businessId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (decremented.count === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.INSUFFICIENT_STOCK);
    }

    const created = await tx.purchase.create({
      data: {
        amount: product.price * quantity,
        customer: { connect: { id: customerId } },
        business: { connect: { id: businessId } },
        product: { connect: { id: productId } },
      },
    });

    // Create the reward in `pending` state; the worker computes the points and
    // flips it to `completed` (or `failed`). Points are NOT calculated here.
    await tx.reward.create({
      data: { customerId, businessId, purchaseId: created.id, points: 0, status: 'pending' },
    });

    return created;
  });

  // Stock changed → drop the cached product list for this tenant.
  await invalidateProductListCache(businessId);

  // Hand reward calculation off to the worker; do not await the calculation.
  await enqueueRewardJob({
    customerId,
    businessId,
    purchaseId: purchase.id,
    purchaseAmount: purchase.amount,
  });

  return purchase;
};

/**
 * List all purchases belonging to the logged-in customer (tenant-scoped).
 */
export const getMyPurchases = async (businessId: string, customerId: string): Promise<Purchase[]> => {
  return prisma.purchase.findMany({
    where: { businessId, customerId },
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });
};

/**
 * Get one purchase the customer owns; 404 for anyone else's (or cross-tenant).
 */
export const getPurchaseById = async (
  businessId: string,
  customerId: string,
  id: string
): Promise<Purchase> => {
  const purchase = await prisma.purchase.findFirst({
    where: { id, businessId, customerId },
    include: { product: true, reward: true },
  });
  if (!purchase) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.PURCHASE_NOT_FOUND);
  }
  return purchase;
};

export default {
  createPurchase,
  getMyPurchases,
  getPurchaseById,
};
