import { Queue } from 'bullmq';
import { queueConnection } from './connection.js';
import { RewardJobData } from '../types/reward.type.js';

export const REWARD_QUEUE_NAME = 'reward-processing';
export const REWARD_JOB_NAME = 'calculate-reward';

/**
 * Queue that reward-calculation jobs are pushed onto when a purchase is made.
 * Failed jobs retry 3 times with exponential backoff; after the final attempt
 * they are kept (removeOnFail: false) so they land in the failed/dead-letter set
 * for inspection instead of being deleted.
 */
export const rewardQueue = new Queue<RewardJobData>(REWARD_QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/** Enqueue a reward-calculation job for a purchase. */
export const enqueueRewardJob = async (data: RewardJobData): Promise<void> => {
  await rewardQueue.add(REWARD_JOB_NAME, data);
};
