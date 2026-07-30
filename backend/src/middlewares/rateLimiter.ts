import httpStatus from 'http-status';
import rateLimit from 'express-rate-limit';
import { sendResponse } from '../utils/response.util.js';
import { errorMessages } from '../config/messages.js';

/**
 * Rate limiter for the sensitive auth endpoints (login / register / refresh).
 * Limits each IP to a fixed number of requests per window to slow down
 * credential-stuffing and brute-force attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    sendResponse(res, httpStatus.TOO_MANY_REQUESTS, errorMessages.TOO_MANY_REQUESTS);
  },
});

export default authLimiter;
