import httpStatus from 'http-status';
import { MaintenanceBlock } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { getSpaceById } from './space.service.js';
import { CreateMaintenanceBody } from '../types/maintenance.type.js';

/**
 * Admin: block out a maintenance window for a space. The space is validated
 * first (404 if missing).
 */
export const createMaintenance = async (
  spaceId: string,
  body: CreateMaintenanceBody
): Promise<MaintenanceBlock> => {
  await getSpaceById(spaceId);
  return prisma.maintenanceBlock.create({
    data: {
      spaceId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      reason: body.reason,
    },
  });
};

/** Admin: remove a maintenance block. 404 if missing. */
export const deleteMaintenance = async (id: string): Promise<void> => {
  const block = await prisma.maintenanceBlock.findUnique({ where: { id } });
  if (!block) {
    throw new ApiError(httpStatus.NOT_FOUND, errorMessages.MAINTENANCE_NOT_FOUND);
  }
  await prisma.maintenanceBlock.delete({ where: { id } });
};

export default {
  createMaintenance,
  deleteMaintenance,
};
