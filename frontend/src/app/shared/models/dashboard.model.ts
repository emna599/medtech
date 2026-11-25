import { Role } from './auth.model';
import { Resident } from './resident.model';

export interface FloorStat {
  floor: number;
  rooms: number;
  beds: number;
  occupied: number;
}

export interface DashboardStats {
  activeResidents: number;
  inactiveResidents: number;
  unassignedResidents: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  freeBeds: number;
  occupancyRate: number;
  enabledUsers: number;
  disabledUsers: number;
  usersByRole: Record<Role, number>;
  floors: FloorStat[];
  recentAdmissions: Resident[];
}
