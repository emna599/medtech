export type MealLocation = 'SALLE' | 'CHAMBRE';
export type ServiceKind = 'REPAS' | 'MEDICAMENT';
export type ServiceStatus = 'A_FAIRE' | 'FAIT' | 'REFUSE' | 'ABSENT' | 'PLUS_TARD';
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
  mealRiskVersion?: string;
  mealInstructionsChangedAt?: string | null;
  mealTextureConflict?: boolean;
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
  mealRiskVersion?: string;
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

export type ResidentIdentity = Pick<ResidentCard,
  'id' | 'firstName' | 'lastName' | 'age' | 'room' | 'photoUrl' | 'distinguishingFeatures'>;

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

export interface HandoverAction {
  id: number;
  residentId: number | null;
  residentName: string | null;
  observation: string;
  expectedAction: string;
  authorName: string;
  createdAt: string;
  assignedTo: number | null;
  assigneeName: string | null;
  assignmentVersion: number;
  completedBy: string | null;
  completedAt: string | null;
}

export interface HandoverBoard {
  open: HandoverAction[];
  recentlyCompleted: HandoverAction[];
}

export interface HandoverRequest {
  requestId: string;
  residentId: number | null;
  observation: string;
  expectedAction: string;
}

export type HandoverAssignment = 'CLAIM' | 'RELEASE' | 'TAKE_OVER';

// ------------------------------------------------------------------ fonction, planning, notes

export type Job = 'INFIRMIER' | 'AIDE_SOIGNANT' | 'SERVICE';
export type Shift = 'JOUR' | 'NUIT';
export type NoteCategory = 'TRACABILITE' | 'OBSERVATION' | 'INCIDENT';

export interface PlanningTask {
  /** Heure de début « HH:mm ». */
  start: string;
  end: string;
  label: string;
  kind: 'TRANSMISSION' | 'TOURNEE' | 'REPAS' | 'SOINS' | 'PAUSE';
  /** Service à ouvrir pendant cette plage, s'il y en a un. */
  focus: ServiceKind | null;
}

export interface Planning {
  job: Job;
  shift: Shift;
  tasks: PlanningTask[];
}

export interface Note {
  id: number;
  content: string;
  category: NoteCategory;
  createdAt: string;
  authorName: string;
  authorJob: Job;
  resident: { id: number; name: string; room: string | null } | null;
}

export const JOB_LABEL: Record<Job, string> = {
  INFIRMIER: 'Infirmier(ère)',
  AIDE_SOIGNANT: 'Aide-soignant(e)',
  SERVICE: 'Service en salle',
};

export const SHIFT_LABEL: Record<Shift, string> = {
  JOUR: 'Équipe de jour',
  NUIT: 'Équipe de nuit',
};

export const NOTE_CATEGORY_LABEL: Record<NoteCategory, string> = {
  TRACABILITE: 'Traçabilité',
  OBSERVATION: 'Observation',
  INCIDENT: 'Incident',
};

/** Minutes depuis minuit pour « HH:mm ». */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Plages du planning en cours à l'heure donnée (en minutes depuis minuit), car certaines se chevauchent
 * (par exemple tournée de médicaments et distribution des repas à midi).
 * La nuit commence le soir : une plage de 03 h compte comme « 27 h » et la nuit court jusqu'à 7 h du lendemain.
 */
export function currentTaskIndices(tasks: readonly PlanningTask[], shift: Shift, nowMinutes: number): number[] {
  const lift = (minutes: number) => (shift === 'NUIT' && minutes < 12 * 60 ? minutes + 24 * 60 : minutes);
  const now = lift(nowMinutes);
  const indices: number[] = [];
  tasks.forEach((task, index) => {
    const end = lift(minutesOf(task.end)) + (minutesOf(task.end) === 23 * 60 + 59 ? 1 : 0);
    if (now >= lift(minutesOf(task.start)) && now < end) {
      indices.push(index);
    }
  });
  return indices;
}

/** Première plage en cours, ou -1. */
export function currentTaskIndex(tasks: readonly PlanningTask[], shift: Shift, nowMinutes: number): number {
  return currentTaskIndices(tasks, shift, nowMinutes)[0] ?? -1;
}

// ------------------------------------------------------------------ équipe en service

export interface TeamMember {
  userId: number;
  name: string;
  job: Job;
  shift: Shift;
  since: string;
  residents: number;
  /** Chambres de sa part, par exemple « 3 à 21 ». */
  rooms: string | null;
  me: boolean;
}

export interface Team {
  /** Le soignant connecté est en service. */
  present: boolean;
  myJob: Job;
  residentTotal: number;
  maxPerNurse: number;
  nurses: number;
  aides: number;
  members: TeamMember[];
  myResidentIds: number[];
  alerts: string[];
}

// ---------- Interface Service : salle à manger et menu de la semaine ----------

export type DiningSlot = 'DEJEUNER' | 'DINER';

export interface DiningMeal {
  id: number;
  status: ServiceStatus;
}

/** Un résident à table (numéro d'arrivée de 1 à 8), son chevalet et le repas à lui servir. */
export interface DiningSeat {
  position: number;
  resident: Pick<ResidentCard, 'id' | 'firstName' | 'lastName' | 'room'>;
  chevalet: string | null;
  meal: DiningMeal | null;
}

export interface DiningTable {
  id: number;
  label: string;
  capacity: number;
  present: number;
  served: number;
  readerCode: string | null;
  seats: DiningSeat[];
}

export interface Reading {
  status: 'OK' | 'ALREADY' | 'MOVED' | 'LEFT';
  residentId: number;
  residentName: string;
  tableLabel: string;
  message: string;
}

export interface MenuEntry {
  dayOfWeek: number;
  mealType: DiningSlot;
  starter: string | null;
  mainCourse: string;
  side: string | null;
  dessert: string | null;
}

export interface Dining {
  slot: DiningSlot;
  date: string;
  menu: MenuEntry | null;
  seated: number;
  served: number;
  tables: DiningTable[];
}

export interface WeeklyMenu {
  weekStart: string;
  entries: MenuEntry[];
}

export const DAY_LABEL = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
