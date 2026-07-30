import httpStatus from 'http-status';
import { Business } from '@prisma/client';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { CreateBusinessBody } from '../types/business.type.js';

/** Business details are cached for 10 minutes. */
const CACHE_TTL_SECONDS = 10 * 60;
const cacheKey = (id: string): string => `business:${id}`;

/**
 * Create a new business (slug must be unique).
 */
export const createBusiness = async (data: CreateBusinessBody): Promise<Business> => {
  const existing = await prisma.business.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.SLUG_TAKEN);
  }
  return prisma.business.create({ data });
};

/**
 * Get a business by id, served from the Redis cache when available.
 */
export const getBusinessById = async (id: string): Promise<Business> => {
  const cached = await redis.get(cacheKey(id));
  if (cached) {
    return JSON.parse(cached) as Business;
  }

  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.BUSINESS_NOT_FOUND);
  }

  await redis.set(cacheKey(id), JSON.stringify(business), 'EX', CACHE_TTL_SECONDS);
  return business;
};

export default {
  createBusiness,
  getBusinessById,
};
