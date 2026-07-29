import express, { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as productValidation from '../../validations/product.validation.js';
import * as productController from '../../controllers/product.controller.js';

const router: Router = express.Router();

router
  .route('/')
  .get(authenticate, productController.listProducts)
  .post(authenticate, requireRole('admin'), validate(productValidation.createProduct), productController.createProduct);

router
  .route('/:id')
  .get(authenticate, validate(productValidation.getProduct), productController.getProduct)
  .put(authenticate, requireRole('admin'), validate(productValidation.updateProduct), productController.updateProduct)
  .delete(
    authenticate,
    requireRole('admin'),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

export default router;
