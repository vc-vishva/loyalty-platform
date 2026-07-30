import { Reward } from '@prisma/client';
import prisma from '../config/prisma.js';
import { RewardSummary } from '../types/reward.type.js';

/**
 * List all rewards for a customer (tenant-scoped), each with its source purchase.
 */
export const getMyRewards = async (businessId: string, customerId: string): Promise<Reward[]> => {
  return prisma.reward.findMany({
    where: { businessId, customerId },
    orderBy: { createdAt: 'desc' },
    include: { purchase: true },
  });
};

/**
 * Summarise a customer's reward points by status:
 *  - totalEarned  = points from completed rewards
 *  - totalPending = points from pending rewards
 *  - netAvailable = points usable now (earned)
 */
export const getRewardSummary = async (businessId: string, customerId: string): Promise<RewardSummary> => {
  // Earned = points already granted by the worker (completed rewards).
  const earned = await prisma.reward.aggregate({
    where: { businessId, customerId, status: 'completed' },
    _sum: { points: true },
  });
  const totalEarned = earned._sum.points ?? 0;

  // Pending = anticipated points for rewards not yet processed. Points aren't
  // stored until the worker runs, so we derive them here (read-time only, never
  // in the purchase request) from the source purchase amount and reward unit.
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const unit = business?.rewardUnitValue ?? 0;
  const pendingRewards = await prisma.reward.findMany({
    where: { businessId, customerId, status: 'pending' },
    include: { purchase: true },
  });
  const totalPending =
    unit > 0 ? pendingRewards.reduce((sum, r) => sum + Math.floor(r.purchase.amount / unit), 0) : 0;

  return { totalEarned, totalPending, netAvailable: totalEarned };
};

/**
 * List rewards for any customer within the admin's business. Because the query
 * is scoped to businessId, an admin can never see another tenant's customer.
 */
export const getCustomerRewards = async (businessId: string, customerId: string): Promise<Reward[]> => {
  return prisma.reward.findMany({
    where: { businessId, customerId },
    orderBy: { createdAt: 'desc' },
    include: { purchase: true },
  });
};

export default {
  getMyRewards,
  getRewardSummary,
  getCustomerRewards,
};
