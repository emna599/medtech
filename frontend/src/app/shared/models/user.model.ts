import { Role } from './auth.model';

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  enabled: boolean;
  createdAt: string | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface UpdateUserPayload {
  fullName: string;
  role: Role;
  enabled: boolean;
}

export const ALL_ROLES: Role[] = ['ADMIN', 'PERSONNEL', 'MEDECIN'];
