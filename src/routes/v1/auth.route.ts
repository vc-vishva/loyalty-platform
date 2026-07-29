import express, { Router } from 'express';
import validate from '../../middlewares/validate.js';
import * as authValidation from '../../validations/auth.validation.js';
import * as authController from '../../controllers/auth.controller.js';

const router: Router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);

export default router;
