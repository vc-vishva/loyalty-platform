import { z } from 'zod';
import { uuid } from './custom.validation.js';

export const getCustomerRewards = {
  params: z.object({ id: uuid }),
};

export default {
  getCustomerRewards,
};
