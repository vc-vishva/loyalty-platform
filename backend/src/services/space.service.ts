import httpStatus from 'http-status';
import { Prisma, Space, Booking, MaintenanceBlock } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { CreateSpaceBody, UpdateSpaceBody, SpaceListQuery } from '../types/space.type.js';
import { Paginated } from '../types/common.type.js';

/** Parse a YYYY-MM-DD date string into the UTC [dayStart, dayEnd) boundaries. */
const dayBounds = (date: string): { dayStart: Date; dayEnd: Date } => {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return { dayStart, dayEnd };
};

/**
 * List spaces with pagination, name search, and type / capacity / date-availability
 * filters. A space is considered "available on `date`" unless it is fully blocked
 * for that whole day by maintenance or an approved booking.
 */
export const listSpaces = async (query: SpaceListQuery): Promise<Paginated<Space>> => {
  const { page, limit, search, type, capacity, date } = query;

  const where: Prisma.SpaceWhereInput = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (type) {
    where.type = type;
  }
  if (capacity !== undefined) {
    where.capacity = { gte: capacity };
  }
  if (date) {
    const { dayStart, dayEnd } = dayBounds(date);
    const fullDayCover = { startTime: { lte: dayStart }, endTime: { gte: dayEnd } };
    // Exclude spaces whose entire day is taken by maintenance or an approved booking.
    where.NOT = [
      { maintenanceBlocks: { some: fullDayCover } },
      { bookings: { some: { status: 'approved', ...fullDayCover } } },
    ];
  }

  const [totalResults, results] = await Promise.all([
    prisma.space.count({ where }),
    prisma.space.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    results,
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults / limit),
  };
};

/** Get a single space or 404. */
export const getSpaceById = async (id: string): Promise<Space> => {
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.SPACE_NOT_FOUND);
  }
  return space;
};

/**
 * Availability for a space on a given date: the active (pending/approved)
 * bookings and maintenance blocks that intersect that day — the calendar feed a
 * visitor sees.
 */
export const getAvailability = async (
  id: string,
  date: string
): Promise<{ date: string; bookings: Booking[]; maintenanceBlocks: MaintenanceBlock[] }> => {
  await getSpaceById(id);
  const { dayStart, dayEnd } = dayBounds(date);
  const intersectsDay = { startTime: { lt: dayEnd }, endTime: { gt: dayStart } };

  const [bookings, maintenanceBlocks] = await Promise.all([
    prisma.booking.findMany({
      where: { spaceId: id, status: { in: ['pending', 'approved'] }, ...intersectsDay },
      orderBy: { startTime: 'asc' },
    }),
    prisma.maintenanceBlock.findMany({
      where: { spaceId: id, ...intersectsDay },
      orderBy: { startTime: 'asc' },
    }),
  ]);

  return { date, bookings, maintenanceBlocks };
};

/** Create a space (admin). */
export const createSpace = async (data: CreateSpaceBody): Promise<Space> => {
  return prisma.space.create({
    data: { ...data, amenities: data.amenities ?? [] },
  });
};

/** Update a space owned by no tenant (admin). 404 if missing. */
export const updateSpace = async (id: string, data: UpdateSpaceBody): Promise<Space> => {
  await getSpaceById(id);
  return prisma.space.update({ where: { id }, data });
};

/** Delete a space (admin). 404 if missing. */
export const deleteSpace = async (id: string): Promise<void> => {
  await getSpaceById(id);
  await prisma.space.delete({ where: { id } });
};

export default {
  listSpaces,
  getSpaceById,
  getAvailability,
  createSpace,
  updateSpace,
  deleteSpace,
};
