import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { getAuth } from '../utils/auth.util.js';
import { productService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreateProductBody, UpdateProductBody, ProductIdParams } from '../types/product.type.js';

export const listProducts = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const products = await productService.listProducts(businessId);
  sendResponse(res, httpStatus.OK, successMessages.PRODUCT_LIST_FETCHED, products);
});

export const getProduct = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const { id } = req.params as unknown as ProductIdParams;
  const product = await productService.getProductById(businessId, id);
  sendResponse(res, httpStatus.OK, successMessages.PRODUCT_FETCHED, product);
});

export const createProduct = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const body = req.body as CreateProductBody;
  const product = await productService.createProduct(businessId, body);
  sendResponse(res, httpStatus.CREATED, successMessages.PRODUCT_CREATED, product);
});

export const updateProduct = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const { id } = req.params as unknown as ProductIdParams;
  const body = req.body as UpdateProductBody;
  const product = await productService.updateProduct(businessId, id, body);
  sendResponse(res, httpStatus.OK, successMessages.PRODUCT_UPDATED, product);
});

export const deleteProduct = catchAsync(async (req, res) => {
  const { businessId } = getAuth(req);
  const { id } = req.params as unknown as ProductIdParams;
  await productService.deleteProduct(businessId, id);
  sendResponse(res, httpStatus.OK, successMessages.PRODUCT_DELETED, null);
});

export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
