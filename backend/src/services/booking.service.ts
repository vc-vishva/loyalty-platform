import httpStatus from 'http-status';
import { Prisma, Booking } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { getSpaceById } from './space.service.js';
import { notifyBookingStatusChange } from './notification.service.js';
import { CreateBookingBody, BookingListQuery } from '../types/booking.type.js';
import { Paginated } from '../types/common.type.js';

/**
 * Detect a PostgreSQL exclusion-constraint violation (23P01) raised by the
 * `bookings_no_overlap` GiST constraint. Prisma surfaces raw DB errors here, so
 * we match on the constraint name / SQLSTATE.
 */
const isOverlapError = (error: unknown): boolean => {
  const text = String(
    (error as { message?: string })?.message ?? error
  );
  return text.includes('bookings_no_overlap') || text.includes('23P01');
};

/**
 * Create a booking request (status = pending).
 *
 * Concurrency & conflict rules:
 *  - Rejected if the space is under maintenance during the slot.
 *  - Rejected if it overlaps an already-*approved* booking for the space.
 *  - Overlapping *pending* requests are allowed to coexist; the admin approves
 *    one, which auto-rejects the rest. A DB-level GiST exclusion constraint
 *    (`bookings_no_overlap`, partial on status='approved') guarantees that even
 *    under simultaneous approvals a slot can end up with at most one approved
 *    booking — the definitive concurrency guard.
 */
export const createBooking = async (memberId: string, body: CreateBookingBody): Promise<Booking> => {
  const start = new Date(body.startTime);
  const end = new Date(body.endTime);

  await getSpaceById(body.spaceId); // 404 if the space does not exist

  const overlaps = { startTime: { lt: end }, endTime: { gt: start } };

  const maintenance = await prisma.maintenanceBlock.findFirst({
    where: { spaceId: body.spaceId, ...overlaps },
  });
  if (maintenance) {
    throw new ApiError(httpStatus.CONFLICT, errorMessages.SLOT_MAINTENANCE);
  }

  const approvedClash = await prisma.booking.findFirst({
    where: { spaceId: body.spaceId, status: 'approved', ...overlaps },
  });
  if (approvedClash) {
    throw new ApiError(httpStatus.CONFLICT, errorMessages.SLOT_UNAVAILABLE);
  }

  const booking = await prisma.booking.create({
    data: { spaceId: body.spaceId, memberId, startTime: start, endTime: end },
  });

  await notifyBookingStatusChange(booking, 'pending');
  return booking;
};

/** List the logged-in member's own bookings. */
export const getMyBookings = async (memberId: string): Promise<Booking[]> => {
  return prisma.booking.findMany({
    where: { memberId },
    orderBy: { startTime: 'desc' },
    include: { space: true },
  });
};

/** Get one booking the member owns; 404 for anyone else's. */
export const getMyBookingById = async (memberId: string, id: string): Promise<Booking> => {
  const booking = await prisma.booking.findFirst({
    where: { id, memberId },
    include: { space: true },
  });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.BOOKING_NOT_FOUND);
  }
  return booking;
};

/**
 * Cancel the member's own booking. Only future pending/approved bookings can be
 * cancelled.
 */
export const cancelBooking = async (memberId: string, id: string): Promise<Booking> => {
  const booking = await getMyBookingById(memberId, id);
  const isActive = booking.status === 'pending' || booking.status === 'approved';
  const isFuture = booking.startTime.getTime() > Date.now();
  if (!isActive || !isFuture) {
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.BOOKING_NOT_CANCELLABLE);
  }
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
  await notifyBookingStatusChange(updated, 'cancelled');
  return updated;
};

/** Admin: list all bookings, filterable by status / date / space, paginated. */
export const listBookings = async (query: BookingListQuery): Promise<Paginated<Booking>> => {
  const { page, limit, status, date, spaceId } = query;

  const where: Prisma.BookingWhereInput = {};
  if (status) {
    where.status = status;
  }
  if (spaceId) {
    where.spaceId = spaceId;
  }
  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    // Bookings that intersect the requested day.
    where.startTime = { lt: dayEnd };
    where.endTime = { gt: dayStart };
  }

  const [totalResults, results] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { space: true, member: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    results,
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults / limit),
  };
};

/**
 * Admin: approve a pending booking. In one serializable transaction we flip it to
 * `approved` (guarded by the exclusion constraint) and auto-reject every other
 * pending booking that overlaps its slot for the same space.
 */
export const approveBooking = async (id: string): Promise<Booking> => {
  const { approved, rejectedIds } = await prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, errorMessages.BOOKING_NOT_FOUND);
      }
      if (booking.status !== 'pending') {
        throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.BOOKING_NOT_PENDING);
      }

      let approvedBooking: Booking;
      try {
        approvedBooking = await tx.booking.update({ where: { id }, data: { status: 'approved' } });
      } catch (error) {
        if (isOverlapError(error)) {
          throw new ApiError(httpStatus.CONFLICT, errorMessages.SLOT_UNAVAILABLE);
        }
        throw error;
      }

      const clashing = await tx.booking.findMany({
        where: {
          id: { not: id },
          spaceId: booking.spaceId,
          status: 'pending',
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime },
        },
        select: { id: true },
      });
      const rejected = clashing.map((b) => b.id);
      if (rejected.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: rejected } },
          data: { status: 'rejected' },
        });
      }

      return { approved: approvedBooking, rejectedIds: rejected };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await notifyBookingStatusChange(approved, 'approved');
  if (rejectedIds.length > 0) {
    const rejectedBookings = await prisma.booking.findMany({ where: { id: { in: rejectedIds } } });
    await Promise.all(rejectedBookings.map((b) => notifyBookingStatusChange(b, 'rejected')));
  }
  return approved;
};

/** Admin: reject a pending booking. */
export const rejectBooking = async (id: string): Promise<Booking> => {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.BOOKING_NOT_FOUND);
  }
  if (booking.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.BOOKING_NOT_PENDING);
  }
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'rejected' } });
  await notifyBookingStatusChange(updated, 'rejected');
  return updated;
};

export default {
  createBooking,
  getMyBookings,
  getMyBookingById,
  cancelBooking,
  listBookings,
  approveBooking,
  rejectBooking,
};
