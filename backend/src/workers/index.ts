import logger from '../config/logger.js';
import { rewardWorker } from './reward.worker.js';
import { REWARD_QUEUE_NAME } from '../queues/reward.queue.js';

logger.info(`Reward worker started — listening on '${REWARD_QUEUE_NAME}'`);

const shutdown = (): void => {
  rewardWorker
    .close()
    .then(() => {
      logger.info('Reward worker closed');
      process.exit(0);
    })
    .catch((error: unknown) => {
      logger.error(error);
      process.exit(1);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
