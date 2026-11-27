export type Role = 'ADMIN' | 'PERSONNEL' | 'MEDECIN';

export interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserInfo;
}

/** Page d'accueil de chaque rôle après la connexion. */
export const ROLE_HOME_ROUTE: Record<Role, string> = {
  ADMIN: '/admin',
  PERSONNEL: '/personnel',
  MEDECIN: '/medecin',
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrateur',
  PERSONNEL: 'Personnel',
  MEDECIN: 'Médecin',
};
