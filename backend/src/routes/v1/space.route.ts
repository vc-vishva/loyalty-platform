import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as spaceValidation from '../../validations/space.validation.js';
import * as maintenanceValidation from '../../validations/maintenance.validation.js';
import * as spaceController from '../../controllers/space.controller.js';
import * as maintenanceController from '../../controllers/maintenance.controller.js';

const router: Router = express.Router();

router
  .route('/')
  .get(validate(spaceValidation.listSpaces), spaceController.listSpaces) // public (visitor)
  .post(authenticate, requireRole('admin'), validate(spaceValidation.createSpace), spaceController.createSpace);

router
  .route('/:id')
  .get(validate(spaceValidation.getSpace), spaceController.getSpace) // public
  .put(authenticate, requireRole('admin'), validate(spaceValidation.updateSpace), spaceController.updateSpace)
  .delete(authenticate, requireRole('admin'), validate(spaceValidation.deleteSpace), spaceController.deleteSpace);

// Public availability calendar feed for a space on a given date.
router.get('/:id/availability', validate(spaceValidation.getAvailability), spaceController.getAvailability);

// Admin: block out a maintenance window for a space.
router.post(
  '/:id/maintenance',
  authenticate,
  requireRole('admin'),
  validate(maintenanceValidation.createMaintenance),
  maintenanceController.createMaintenance
);

export default router;
