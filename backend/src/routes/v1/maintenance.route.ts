import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as maintenanceValidation from '../../validations/maintenance.validation.js';
import * as maintenanceController from '../../controllers/maintenance.controller.js';

const router: Router = express.Router();

// Admin: remove a maintenance block. (Creation lives under /spaces/:id/maintenance.)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(maintenanceValidation.deleteMaintenance),
  maintenanceController.deleteMaintenance
);

export default router;
