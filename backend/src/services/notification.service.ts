import { Booking, BookingStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Notification stub (bonus): called whenever a booking's status changes.
 * In a real system this would send an email / push. Here it looks up the member
 * and logs the message that would be delivered — a clear, testable seam that can
 * later be swapped for a real transport (SES, SendGrid, a queue, etc.).
 */
export const notifyBookingStatusChange = async (
  booking: Booking,
  status: BookingStatus
): Promise<void> => {
  try {
    const member = await prisma.user.findUnique({ where: { id: booking.memberId } });
    const to = member?.email ?? booking.memberId;
    logger.info(
      `[notification] to=${to} booking=${booking.id} space=${booking.spaceId} ` +
        `status=${status} slot=${booking.startTime.toISOString()}..${booking.endTime.toISOString()}`
    );
  } catch (error) {
    // Notifications are best-effort; never fail the request because of them.
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[notification] failed for booking=${booking.id}: ${message}`);
  }
};

export default { notifyBookingStatusChange };
