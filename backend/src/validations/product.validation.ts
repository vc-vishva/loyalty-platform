import { z } from 'zod';
import { uuid } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

const name = z.string().min(1, `name ${validationMessages.REQUIRED}`);
const description = z.string().min(1, `description ${validationMessages.REQUIRED}`);
const price = z.number().int().min(1, validationMessages.INVALID_PRICE);
const stock = z.number().int().min(0, validationMessages.INVALID_STOCK);

const idParams = z.object({ id: uuid });

/** Query schema for GET /products (pagination + search + price filter). */
export const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1, validationMessages.INVALID_PAGE).default(1),
  limit: z.coerce.number().int().min(1, validationMessages.INVALID_LIMIT).max(100, validationMessages.INVALID_LIMIT).default(10),
  search: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().int().min(0, validationMessages.INVALID_PRICE_FILTER).optional(),
  maxPrice: z.coerce.number().int().min(0, validationMessages.INVALID_PRICE_FILTER).optional(),
});

export const createProduct = {
  body: z.object({ name, description, price, stock }),
};

export const getProduct = {
  params: idParams,
};

export const updateProduct = {
  params: idParams,
  body: z
    .object({
      name: name.optional(),
      description: description.optional(),
      price: price.optional(),
      stock: stock.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { error: validationMessages.UPDATE_EMPTY }),
};

export const deleteProduct = {
  params: idParams,
};

export default {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
