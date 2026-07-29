import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as userValidation from '../../validations/user.validation.js';
import * as userController from '../../controllers/user.controller.js';

const router: Router = express.Router();

router
  .route('/')
  .post(authenticate, requireRole('admin'), validate(userValidation.createUser), userController.createUser);

export default router;
