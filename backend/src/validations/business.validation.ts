import { z } from 'zod';
import { uuid } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const createBusiness = {
  body: z.object({
    name: z.string().min(1, `name ${validationMessages.REQUIRED}`),
    slug: z
      .string()
      .min(1, `slug ${validationMessages.REQUIRED}`)
      .regex(/^[a-z0-9-]+$/, validationMessages.INVALID_SLUG),
    rewardUnitValue: z.number().int().min(1, validationMessages.INVALID_REWARD_UNIT),
  }),
};

export const getBusiness = {
  params: z.object({
    id: uuid,
  }),
};

export default {
  createBusiness,
  getBusiness,
};
