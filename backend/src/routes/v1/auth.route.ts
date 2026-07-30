import express, { Router } from 'express';
import validate from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import * as authValidation from '../../validations/auth.validation.js';
import * as authController from '../../controllers/auth.controller.js';

const router: Router = express.Router();

router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/refresh', authLimiter, validate(authValidation.refresh), authController.refresh);
router.post('/logout', authenticate, validate(authValidation.logout), authController.logout);

export default router;
