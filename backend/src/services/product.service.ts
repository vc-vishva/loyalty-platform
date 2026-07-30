import httpStatus from 'http-status';
import { Prisma, Product } from '@prisma/client';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { CreateProductBody, UpdateProductBody, ProductListQuery, Paginated } from '../types/product.type.js';

/** Product list is cached per business for 5 minutes; the key includes the businessId. */
const CACHE_TTL_SECONDS = 5 * 60;
const DEFAULT_LIMIT = 10;
const listCacheKey = (businessId: string): string => `products:${businessId}:list`;

export const invalidateProductListCache = async (businessId: string): Promise<void> => {
  await redis.del(listCacheKey(businessId));
};

/**
 * List products for a business with pagination, name search and price filter —
 * always tenant-scoped by businessId.
 *
 * Caching: only the plain default page (page 1, default limit, no search/filter)
 * is cached in Redis (key includes businessId, 5 min TTL) and invalidated on any
 * write. Filtered / searched / other-page requests always read fresh from the DB
 * so results are never stale.
 */
export const listProducts = async (
  businessId: string,
  query: ProductListQuery
): Promise<Paginated<Product>> => {
  const { page, limit, search, minPrice, maxPrice } = query;

  const isDefaultView =
    page === 1 && limit === DEFAULT_LIMIT && !search && minPrice === undefined && maxPrice === undefined;

  if (isDefaultView) {
    const cached = await redis.get(listCacheKey(businessId));
    if (cached) {
      return JSON.parse(cached) as Paginated<Product>;
    }
  }

  const where: Prisma.ProductWhereInput = { businessId };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  const priceFilter: Prisma.IntFilter = {};
  if (minPrice !== undefined) {
    priceFilter.gte = minPrice;
  }
  if (maxPrice !== undefined) {
    priceFilter.lte = maxPrice;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = priceFilter;
  }

  const [totalResults, results] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const payload: Paginated<Product> = {
    results,
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults / limit),
  };

  if (isDefaultView) {
    await redis.set(listCacheKey(businessId), JSON.stringify(payload), 'EX', CACHE_TTL_SECONDS);
  }
  return payload;
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
  await invalidateProductListCache(businessId);
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
  await invalidateProductListCache(businessId);
  return product;
};

/**
 * Delete a product owned by the business and invalidate the list cache.
 */
export const deleteProduct = async (businessId: string, id: string): Promise<void> => {
  await getProductById(businessId, id);
  await prisma.product.delete({ where: { id } });
  await invalidateProductListCache(businessId);
};

export default {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
