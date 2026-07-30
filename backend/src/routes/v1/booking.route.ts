import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as bookingValidation from '../../validations/booking.validation.js';
import * as bookingController from '../../controllers/booking.controller.js';

const router: Router = express.Router();

// Member endpoints.
router.post(
  '/',
  authenticate,
  requireRole('member'),
  validate(bookingValidation.createBooking),
  bookingController.createBooking
);
router.get('/my', authenticate, requireRole('member'), bookingController.getMyBookings);
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole('member'),
  validate(bookingValidation.cancelBooking),
  bookingController.cancelBooking
);

// Admin endpoints.
router.get(
  '/',
  authenticate,
  requireRole('admin'),
  validate(bookingValidation.listBookings),
  bookingController.listBookings
);
router.patch(
  '/:id/approve',
  authenticate,
  requireRole('admin'),
  validate(bookingValidation.approveBooking),
  bookingController.approveBooking
);
router.patch(
  '/:id/reject',
  authenticate,
  requireRole('admin'),
  validate(bookingValidation.rejectBooking),
  bookingController.rejectBooking
);

// Shared: a member fetches their own booking (admins can use the list endpoint).
router.get(
  '/:id',
  authenticate,
  requireRole('member'),
  validate(bookingValidation.getBooking),
  bookingController.getBooking
);

export default router;
