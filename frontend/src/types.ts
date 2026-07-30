export type Role = 'member' | 'admin';
export type SpaceType = 'desk' | 'meeting_room';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TokenBundle {
  access: { token: string; expires: string };
  refresh: { token: string; expires: string };
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  description: string;
  amenities: string[];
  createdAt: string;
}

export interface Booking {
  id: string;
  spaceId: string;
  memberId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  space?: Space;
  member?: { id: string; name: string; email: string };
}

export interface MaintenanceBlock {
  id: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface Availability {
  date: string;
  bookings: Booking[];
  maintenanceBlocks: MaintenanceBlock[];
}

export interface Paginated<T> {
  results: T[];
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}
