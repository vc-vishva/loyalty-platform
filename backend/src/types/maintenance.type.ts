/** Request types for the maintenance-block module. */

export interface CreateMaintenanceBody {
  startTime: string;
  endTime: string;
  reason: string;
}

export interface SpaceIdParams {
  id: string;
}

export interface MaintenanceIdParams {
  id: string;
}
