import httpStatus from 'http-status';
import { Product } from '@prisma/client';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { CreateProductBody, UpdateProductBody } from '../types/product.type.js';

/** Product list is cached per business for 5 minutes; the key includes the businessId. */
const CACHE_TTL_SECONDS = 5 * 60;
const listCacheKey = (businessId: string): string => `products:${businessId}`;

const invalidateListCache = async (businessId: string): Promise<void> => {
  await redis.del(listCacheKey(businessId));
};

/**
 * List all products for a business (served from the Redis cache when available).
 */
export const listProducts = async (businessId: string): Promise<Product[]> => {
  const key = listCacheKey(businessId);
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as Product[];
  }
  const products = await prisma.product.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
  await redis.set(key, JSON.stringify(products), 'EX', CACHE_TTL_SECONDS);
  return products;
};

/**
 * Get a single product scoped to the business. Returns 404 (not 403) when the
 * product does not exist OR belongs to another tenant — we never reveal the
 * existence of another tenant's data.
 */
export const getProductById = async (businessId: string, id: string): Promise<Product> => {
  const product = await prisma.product.findFirst({ where: { id, businessId } });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.PRODUCT_NOT_FOUND);
  }
  return product;
};

/**
 * Create a product in the business and invalidate the list cache.
 */
export const createProduct = async (businessId: string, data: CreateProductBody): Promise<Product> => {
  const product = await prisma.product.create({
    data: { ...data, business: { connect: { id: businessId } } },
  });
  await invalidateListCache(businessId);
  return product;
};

/**
 * Update a product owned by the business and invalidate the list cache.
 * Ownership is verified first, so cross-tenant updates return 404.
 */
export const updateProduct = async (
  businessId: string,
  id: string,
  data: UpdateProductBody
): Promise<Product> => {
  await getProductById(businessId, id);
  const product = await prisma.product.update({ where: { id }, data });
  await invalidateListCache(businessId);
  return product;
};

/**
 * Delete a product owned by the business and invalidate the list cache.
 */
export const deleteProduct = async (businessId: string, id: string): Promise<void> => {
  await getProductById(businessId, id);
  await prisma.product.delete({ where: { id } });
  await invalidateListCache(businessId);
};

export default {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
