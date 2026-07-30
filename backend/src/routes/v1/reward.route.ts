import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as rewardValidation from '../../validations/reward.validation.js';
import * as rewardController from '../../controllers/reward.controller.js';

const router: Router = express.Router();

router.get('/my', authenticate, requireRole('customer'), rewardController.getMyRewards);
router.get('/summary', authenticate, requireRole('customer'), rewardController.getRewardSummary);
router.get(
  '/customer/:id',
  authenticate,
  requireRole('admin'),
  validate(rewardValidation.getCustomerRewards),
  rewardController.getCustomerRewards
);

export default router;
