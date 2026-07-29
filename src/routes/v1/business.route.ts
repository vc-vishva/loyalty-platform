import express, { Router } from 'express';
import validate from '../../middlewares/validate.js';
import * as businessValidation from '../../validations/business.validation.js';
import * as businessController from '../../controllers/business.controller.js';

const router: Router = express.Router();

// Both endpoints are public per the spec (a business is created before it has users).
router.post('/', validate(businessValidation.createBusiness), businessController.createBusiness);
router.get('/:id', validate(businessValidation.getBusiness), businessController.getBusiness);

export default router;
