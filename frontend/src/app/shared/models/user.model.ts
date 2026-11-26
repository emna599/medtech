import { Role } from './auth.model';
import { Job, Shift } from './personnel.model';

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  job?: Job | null;
  shift?: Shift | null;
  enabled: boolean;
  createdAt: string | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  job?: Job | null;
  shift?: Shift | null;
}

export interface UpdateUserPayload {
  fullName: string;
  role: Role;
  job?: Job | null;
  shift?: Shift | null;
  enabled: boolean;
}

export const ALL_ROLES: Role[] = ['ADMIN', 'PERSONNEL', 'MEDECIN'];
