import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { getAuth } from '../utils/auth.util.js';
import { bookingService } from '../services/index.js';
import { listBookingsQuery } from '../validations/booking.validation.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreateBookingBody, BookingIdParams, BookingListQuery } from '../types/booking.type.js';

export const createBooking = catchAsync(async (req, res) => {
  const { userId } = getAuth(req);
  const body = req.body as CreateBookingBody;
  const booking = await bookingService.createBooking(userId, body);
  sendResponse(res, httpStatus.CREATED, successMessages.BOOKING_CREATED, booking);
});

export const getMyBookings = catchAsync(async (req, res) => {
  const { userId } = getAuth(req);
  const bookings = await bookingService.getMyBookings(userId);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_LIST_FETCHED, bookings);
});

export const getBooking = catchAsync(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params as unknown as BookingIdParams;
  const booking = await bookingService.getMyBookingById(userId, id);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_FETCHED, booking);
});

export const cancelBooking = catchAsync(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params as unknown as BookingIdParams;
  const booking = await bookingService.cancelBooking(userId, id);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_CANCELLED, booking);
});

export const listBookings = catchAsync(async (req, res) => {
  const query = listBookingsQuery.parse(req.query) as BookingListQuery;
  const bookings = await bookingService.listBookings(query);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_LIST_FETCHED, bookings);
});

export const approveBooking = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as BookingIdParams;
  const booking = await bookingService.approveBooking(id);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_APPROVED, booking);
});

export const rejectBooking = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as BookingIdParams;
  const booking = await bookingService.rejectBooking(id);
  sendResponse(res, httpStatus.OK, successMessages.BOOKING_REJECTED, booking);
});

export default {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  listBookings,
  approveBooking,
  rejectBooking,
};
