import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { maintenanceService } from '../services/index.js';
import { sendResponse } from '../utils/response.util.js';
import { successMessages } from '../config/messages.js';
import { CreateMaintenanceBody, SpaceIdParams, MaintenanceIdParams } from '../types/maintenance.type.js';

export const createMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as SpaceIdParams;
  const body = req.body as CreateMaintenanceBody;
  const block = await maintenanceService.createMaintenance(id, body);
  sendResponse(res, httpStatus.CREATED, successMessages.MAINTENANCE_CREATED, block);
});

export const deleteMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params as unknown as MaintenanceIdParams;
  await maintenanceService.deleteMaintenance(id);
  sendResponse(res, httpStatus.OK, successMessages.MAINTENANCE_DELETED);
});

export default {
  createMaintenance,
  deleteMaintenance,
};
