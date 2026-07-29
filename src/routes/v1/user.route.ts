import express, { Router } from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as userValidation from '../../validations/user.validation.js';
import * as userController from '../../controllers/user.controller.js';

const router: Router = express.Router();

router.route('/').post(auth(), validate(userValidation.createUser), userController.createUser);

export default router;
