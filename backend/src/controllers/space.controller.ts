import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { spaceService } from '../services/index.js';
import { listSpacesQuery } from '../validations/space.validation.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreateSpaceBody, UpdateSpaceBody, SpaceIdParams, SpaceListQuery } from '../types/space.type.js';

export const listSpaces = catchAsync(async (req, res) => {
  // Re-parse to get coerced/defaulted values (Express 5 req.query is read-only).
  const query = listSpacesQuery.parse(req.query) as SpaceListQuery;
  const spaces = await spaceService.listSpaces(query);
  sendResponse(res, httpStatus.OK, successMessages.SPACE_LIST_FETCHED, spaces);
});

export const getSpace = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as SpaceIdParams;
  const space = await spaceService.getSpaceById(id);
  sendResponse(res, httpStatus.OK, successMessages.SPACE_FETCHED, space);
});

export const getAvailability = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as SpaceIdParams;
  const date = String(req.query.date);
  const availability = await spaceService.getAvailability(id, date);
  sendResponse(res, httpStatus.OK, successMessages.AVAILABILITY_FETCHED, availability);
});

export const createSpace = catchAsync(async (req, res) => {
  const body = req.body as CreateSpaceBody;
  const space = await spaceService.createSpace(body);
  sendResponse(res, httpStatus.CREATED, successMessages.SPACE_CREATED, space);
});

export const updateSpace = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as SpaceIdParams;
  const body = req.body as UpdateSpaceBody;
  const space = await spaceService.updateSpace(id, body);
  sendResponse(res, httpStatus.OK, successMessages.SPACE_UPDATED, space);
});

export const deleteSpace = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as SpaceIdParams;
  await spaceService.deleteSpace(id);
  sendResponse(res, httpStatus.OK, successMessages.SPACE_DELETED);
});

export default {
  listSpaces,
  getSpace,
  getAvailability,
  createSpace,
  updateSpace,
  deleteSpace,
};
