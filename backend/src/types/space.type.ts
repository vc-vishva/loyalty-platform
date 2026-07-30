import { SpaceType } from '@prisma/client';

/** Request types for the space module. */

export interface CreateSpaceBody {
  name: string;
  type: SpaceType;
  capacity: number;
  description: string;
  amenities?: string[];
}

export interface UpdateSpaceBody {
  name?: string;
  type?: SpaceType;
  capacity?: number;
  description?: string;
  amenities?: string[];
}

export interface SpaceIdParams {
  id: string;
}

/** Query for GET /spaces: pagination + search + type/capacity/date-availability filter. */
export interface SpaceListQuery {
  page: number;
  limit: number;
  search?: string;
  type?: SpaceType;
  capacity?: number;
  date?: string;
}

/** Query for GET /spaces/:id/availability. */
export interface AvailabilityQuery {
  date: string;
}
