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
  /** Le soignant confirme avoir vérifié un point à risque (allergie / texture / médicament à risque). */
  acknowledgeRisk?: boolean;
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

export interface AssistantResidentRef {
  id: number;
  name: string;
  room: string | null;
}

/** Action proposée par l'assistant : rien n'est enregistré avant la confirmation du soignant. */
export interface AssistantAction {
  kind: ServiceKind;
  itemId: number;
  summary: string;
}

export interface AssistantReply {
  answer: string;
  intent: string;
  residents: AssistantResidentRef[];
  action: AssistantAction | null;
}

export interface AppetiteDay {
  date: string;
  /** 0 (rien mangé ou refus) à 1 (tout mangé) ; null s'il n'y a pas de repas enregistré. */
  score: number | null;
  meals: number;
  refused: number;
}

export interface Appetite {
  days: AppetiteDay[];
  recentAverage: number | null;
  previousAverage: number | null;
  declining: boolean;
}

/** Résultat de la lecture d'une étiquette de pochette : l'OCR propose, le soignant vérifie le visage. */
export interface PochetteScan {
  status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'UNAVAILABLE';
  message: string;
  resident: ResidentCard | null;
  nameRead: string | null;
  prise: string | null;
  date: string | null;
  medications: string | null;
}
