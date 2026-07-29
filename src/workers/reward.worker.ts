import { Worker, Job } from 'bullmq';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { queueConnection } from '../queues/connection.js';
import { REWARD_QUEUE_NAME } from '../queues/reward.queue.js';
import { RewardJobData } from '../types/reward.type.js';

/**
 * Process one reward job:
 *  - points = floor(purchaseAmount / business.rewardUnitValue)
 *  - upsert a Reward record with status `completed`
 * On any failure the Reward is marked `failed` and the error is rethrown so
 * BullMQ retries (up to `attempts`); once attempts are exhausted the job stays
 * in the failed set (dead-letter) because the queue uses removeOnFail: false.
 */
const processReward = async (job: Job<RewardJobData>): Promise<void> => {
  const { customerId, businessId, purchaseId, purchaseAmount } = job.data;
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    const points = Math.floor(purchaseAmount / business.rewardUnitValue);

    await prisma.reward.upsert({
      where: { purchaseId },
      create: { customerId, businessId, purchaseId, points, status: 'completed' },
      update: { points, status: 'completed' },
    });

    logger.info(
      `[reward] job=${job.id} customer=${customerId} business=${businessId} points=${points} status=completed`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.reward
      .upsert({
        where: { purchaseId },
        create: { customerId, businessId, purchaseId, points: 0, status: 'failed' },
        update: { status: 'failed' },
      })
      .catch(() => undefined);
    logger.error(
      `[reward] job=${job.id} customer=${customerId} business=${businessId} status=failed error=${message}`
    );
    throw error;
  }
};

export const rewardWorker = new Worker<RewardJobData>(REWARD_QUEUE_NAME, processReward, {
  connection: queueConnection,
});

rewardWorker.on('failed', (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    logger.error(
      `[reward] job=${job.id} exhausted ${job.attemptsMade} attempts -> dead-letter. error=${err.message}`
    );
  }
});
