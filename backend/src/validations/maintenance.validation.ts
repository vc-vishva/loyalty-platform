import { z } from 'zod';
import { uuid, isoDateTime } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

export const createMaintenance = {
  params: z.object({ id: uuid }),
  body: z
    .object({
      startTime: isoDateTime,
      endTime: isoDateTime,
      reason: z.string().min(1, `reason ${validationMessages.REQUIRED}`),
    })
    .refine((data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
      error: validationMessages.INVALID_TIME_RANGE,
      path: ['endTime'],
    }),
};

export const deleteMaintenance = {
  params: z.object({ id: uuid }),
};

export default {
  createMaintenance,
  deleteMaintenance,
};
