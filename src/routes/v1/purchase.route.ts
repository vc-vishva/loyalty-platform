import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as purchaseValidation from '../../validations/purchase.validation.js';
import * as purchaseController from '../../controllers/purchase.controller.js';

const router: Router = express.Router();

// All purchase endpoints are customer-only.
router.post(
  '/',
  authenticate,
  requireRole('customer'),
  validate(purchaseValidation.createPurchase),
  purchaseController.createPurchase
);

// '/my' must be registered before '/:id' so it is not captured as an id.
router.get('/my', authenticate, requireRole('customer'), purchaseController.getMyPurchases);

router.get(
  '/:id',
  authenticate,
  requireRole('customer'),
  validate(purchaseValidation.getPurchase),
  purchaseController.getPurchase
);

export default router;
