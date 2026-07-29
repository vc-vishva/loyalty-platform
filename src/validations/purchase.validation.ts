import { z } from 'zod';
import { uuid } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const createPurchase = {
  body: z.object({
    productId: uuid,
    quantity: z.number().int().positive(validationMessages.INVALID_QUANTITY).default(1),
  }),
};

export const getPurchase = {
  params: z.object({ id: uuid }),
};

export default {
  createPurchase,
  getPurchase,
};
