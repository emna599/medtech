export type MealLocation = 'SALLE' | 'CHAMBRE';
export type ServiceKind = 'REPAS' | 'MEDICAMENT';
export type ServiceStatus = 'A_FAIRE' | 'FAIT' | 'REFUSE' | 'PLUS_TARD';
export type QuantityEaten = 'RIEN' | 'QUART' | 'MOITIE' | 'TROIS_QUARTS' | 'TOUT';

export interface Allergy {
  name: string;
  severity: string | null;
}

/** Fiche résident vue par le personnel : sans historique médical. */
export interface ResidentCard {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  room: string | null;
  floor: number | null;
  photoUrl: string | null;
  mealLocation: MealLocation;
  needsHelp: boolean;
  distinguishingFeatures: string | null;
  allergies: Allergy[];
  regime: string | null;
  texture: string | null;
  restrictions: string | null;
  instructions: string | null;
  identityDoubt: boolean;
}

/** Un repas à servir ou une prise de médicament à donner. */
export interface ServiceItem {
  kind: ServiceKind;
  id: number;
  slot: string;
  label: string;
  detail: string | null;
  scheduledAt: string;
  status: ServiceStatus;
  highRisk: boolean;
  quantityEaten: QuantityEaten | null;
  resident: ResidentCard;
}

export interface Doubt {
  id: number;
  residentId: number;
  residentName: string;
  note: string | null;
  createdAt: string;
  resolved: boolean;
  reportedBy: string;
}

export interface CompleteRequest {
  status: Exclude<ServiceStatus, 'A_FAIRE'>;
  comment?: string;
}

export const SLOT_LABEL: Record<string, string> = {
  PETIT_DEJEUNER: 'Petit-déjeuner',
  DEJEUNER: 'Déjeuner',
  GOUTER: 'Goûter',
  DINER: 'Dîner',
  MATIN: 'Matin',
  MIDI: 'Midi',
  SOIR: 'Soir',
  COUCHER: 'Coucher',
};

export const QUANTITY_LABEL: Record<QuantityEaten, string> = {
  RIEN: 'Rien',
  QUART: '¼',
  MOITIE: '½',
  TROIS_QUARTS: '¾',
  TOUT: 'Tout',
};

export const QUANTITIES: readonly QuantityEaten[] = ['RIEN', 'QUART', 'MOITIE', 'TROIS_QUARTS', 'TOUT'];

export const REFUSAL_REASONS: Record<ServiceKind, readonly string[]> = {
  REPAS: ["N'a pas faim", 'Fatigué(e)', 'Douleur', "N'aime pas le plat", 'Difficulté à avaler', 'Autre'],
  MEDICAMENT: ['Refuse de le prendre', 'Difficulté à avaler', 'Nausées', 'Endormi(e)', 'Autre'],
};

export function slotLabel(slot: string): string {
  return SLOT_LABEL[slot] ?? slot;
}

export function fullName(resident: Pick<ResidentCard, 'firstName' | 'lastName'>): string {
  return `${resident.firstName} ${resident.lastName.toUpperCase()}`;
}

/** Libellé de l'action réussie : « Servi » pour un repas, « Donné » pour un médicament. */
export function doneLabel(kind: ServiceKind): string {
  return kind === 'REPAS' ? 'Servi' : 'Donné';
}
