export interface Resident {
  id: number;
  firstName: string;
  lastName: string;
  /** Format AAAA-MM-JJ. */
  birthDate: string;
  admissionDate: string;
  active: boolean;
  roomId: number | null;
  roomNumber: string | null;
  floor: number | null;
}

export interface ResidentPayload {
  firstName: string;
  lastName: string;
  birthDate: string;
  admissionDate: string;
  roomId: number | null;
  active?: boolean;
}

/** Âge en années à partir d'une date AAAA-MM-JJ. */
export function ageFrom(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) {
    age--;
  }
  return age;
}

/** Durée de séjour lisible, par exemple « 2 ans 3 mois ». */
export function stayDuration(admissionDate: string): string {
  const start = new Date(admissionDate);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months--;
  }
  if (months < 1) {
    return 'moins d’un mois';
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} an${years > 1 ? 's' : ''}`);
  }
  if (rest > 0) {
    parts.push(`${rest} mois`);
  }
  return parts.join(' ');
}

export interface ResidentSummary {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  active: boolean;
  roomNumber: string | null;
  floor: number | null;
}

export interface ResidentDetail extends ResidentSummary {
  admissionDate: string | null;
}

export interface MedicalRecord {
  history: string | null;
  treatments: string | null;
  updatedAt: string | null;
  version: number;
}

export interface Allergy {
  id: number;
  version: number;
  name: string;
  severity: string | null;
}

export interface AllergyRequest {
  version?: number;
  name: string;
  severity: string | null;
}

export interface DietaryRegime {
  id: number;
  version: number;
  type: string;
  texture: string | null;
  restrictions: string | null;
  intolerances: string | null;
  instructions: string | null;
}

export interface DietaryRegimeRequest {
  version?: number;
  type: string;
  texture: string | null;
  restrictions: string | null;
  intolerances: string | null;
  instructions: string | null;
}

export interface QrCode {
  id: number;
  token: string | null;
  active: boolean;
  residentId: number;
  userId: number | null;
  createdAt: string;
  deactivatedAt: string | null;
}
