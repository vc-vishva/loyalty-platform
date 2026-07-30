import { BookingStatus } from '@prisma/client';

/** Request types for the booking module. */

export interface CreateBookingBody {
  spaceId: string;
  startTime: string;
  endTime: string;
}

export interface BookingIdParams {
  id: string;
}

export interface RejectBookingBody {
  reason?: string;
}

/** Query for GET /bookings (admin): filter by status/date/space + pagination. */
export interface BookingListQuery {
  page: number;
  limit: number;
  status?: BookingStatus;
  date?: string;
  spaceId?: string;
}
