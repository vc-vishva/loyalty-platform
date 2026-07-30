import { z } from 'zod';
import { uuid, dateString } from './custom.validation.js';
import { validationMessages } from '../config/messages.js';

const name = z.string().min(1, `name ${validationMessages.REQUIRED}`);
const description = z.string().min(1, `description ${validationMessages.REQUIRED}`);
const type = z.enum(['desk', 'meeting_room'], { error: validationMessages.INVALID_SPACE_TYPE });
const capacity = z.number().int().min(1, validationMessages.INVALID_CAPACITY);
const amenities = z.array(z.string().min(1)).optional();

const idParams = z.object({ id: uuid });

/** Query schema for GET /spaces (pagination + search + type/capacity/date filter). */
export const listSpacesQuery = z.object({
  page: z.coerce.number().int().min(1, validationMessages.INVALID_PAGE).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, validationMessages.INVALID_LIMIT)
    .max(100, validationMessages.INVALID_LIMIT)
    .default(10),
  search: z.string().trim().min(1).optional(),
  type: z.enum(['desk', 'meeting_room'], { error: validationMessages.INVALID_SPACE_TYPE }).optional(),
  capacity: z.coerce.number().int().min(1, validationMessages.INVALID_CAPACITY).optional(),
  date: dateString.optional(),
});

export const createSpace = {
  body: z.object({ name, type, capacity, description, amenities }),
};

export const getSpace = {
  params: idParams,
};

export const listSpaces = {
  query: listSpacesQuery,
};

export const getAvailability = {
  params: idParams,
  query: z.object({ date: dateString }),
};

export const updateSpace = {
  params: idParams,
  body: z
    .object({
      name: name.optional(),
      type: type.optional(),
      capacity: capacity.optional(),
      description: description.optional(),
      amenities,
    })
    .refine((data) => Object.keys(data).length > 0, { error: validationMessages.UPDATE_EMPTY }),
};

export const deleteSpace = {
  params: idParams,
};

export default {
  createSpace,
  getSpace,
  listSpaces,
  getAvailability,
  updateSpace,
  deleteSpace,
};
