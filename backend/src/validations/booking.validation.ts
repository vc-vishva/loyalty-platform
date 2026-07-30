import { z } from 'zod';
import { uuid, isoDateTime, dateString } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

const idParams = z.object({ id: uuid });

const timeSlot = z
  .object({
    spaceId: uuid,
    startTime: isoDateTime,
    endTime: isoDateTime,
  })
  .refine((data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
    error: validationMessages.INVALID_TIME_RANGE,
    path: ['endTime'],
  })
  .refine((data) => new Date(data.startTime).getTime() > Date.now(), {
    error: validationMessages.BOOKING_PAST,
    path: ['startTime'],
  });

export const createBooking = {
  body: timeSlot,
};

export const getBooking = {
  params: idParams,
};

export const cancelBooking = {
  params: idParams,
};

export const approveBooking = {
  params: idParams,
};

export const rejectBooking = {
  params: idParams,
  body: z.object({ reason: z.string().trim().min(1).max(500).optional() }),
};

/** Query schema for GET /bookings (admin): pagination + status/date/space filter. */
export const listBookingsQuery = z.object({
  page: z.coerce.number().int().min(1, validationMessages.INVALID_PAGE).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, validationMessages.INVALID_LIMIT)
    .max(100, validationMessages.INVALID_LIMIT)
    .default(10),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  date: dateString.optional(),
  spaceId: uuid.optional(),
});

export const listBookings = {
  query: listBookingsQuery,
};

export default {
  createBooking,
  getBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  listBookings,
};
