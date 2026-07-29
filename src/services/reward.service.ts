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
  const grouped = await prisma.reward.groupBy({
    by: ['status'],
    where: { businessId, customerId },
    _sum: { points: true },
  });

  let totalEarned = 0;
  let totalPending = 0;
  for (const row of grouped) {
    const points = row._sum.points ?? 0;
    if (row.status === 'completed') {
      totalEarned = points;
    } else if (row.status === 'pending') {
      totalPending = points;
    }
  }

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
