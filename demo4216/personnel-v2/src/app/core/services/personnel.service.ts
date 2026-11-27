import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Appetite,
  AssistantReply,
  Chevalet,
  CompleteRequest,
  Dining,
  DiningSlot,
  Reading,
  Doubt,
  Note,
  NoteCategory,
  Planning,
  MealLocation,
  PochetteScan,
  QuantityEaten,
  ResidentCard,
  HandoverAction,
  HandoverAssignment,
  HandoverBoard,
  HandoverRequest,
  ScheduledAssignment,
  ServiceItem,
  ServiceKind,
  Team,
  WeeklyMenu,
} from '../../shared/models/personnel.model';

/** Appels vers l'API de l'espace personnel (le jeton est ajouté par l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/personnel`;

  private readonly handover = `${environment.apiUrl}/api/releve`;

  loadHandover(): Observable<HandoverBoard> {
    return this.http.get<HandoverBoard>(this.handover);
  }

  createHandover(request: HandoverRequest): Observable<HandoverAction> {
    return this.http.post<HandoverAction>(this.handover, request);
  }

  assignHandover(id: number, action: HandoverAssignment, version: number): Observable<HandoverAction> {
    return this.http.post<HandoverAction>(`${this.handover}/${id}/assignment`, { action, version });
  }

  completeHandover(id: number, version: number): Observable<HandoverAction> {
    return this.http.post<HandoverAction>(`${this.handover}/${id}/complete`, { version });
  }

  listService(kind: ServiceKind): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>(`${this.base}/service`, { params: { kind } });
  }

  complete(item: ServiceItem, body: CompleteRequest): Observable<ServiceItem> {
    const path = item.kind === 'REPAS' ? 'meals' : 'doses';
    return this.http.post<ServiceItem>(`${this.base}/${path}/${item.id}/complete`, body);
  }

  completeById(kind: ServiceKind, id: number, body: CompleteRequest): Observable<ServiceItem> {
    const path = kind === 'REPAS' ? 'meals' : 'doses';
    return this.http.post<ServiceItem>(`${this.base}/${path}/${id}/complete`, body);
  }

  appetite(residentId: number, days = 7): Observable<Appetite> {
    return this.http.get<Appetite>(`${this.base}/residents/${residentId}/appetite`, { params: { days } });
  }

  ask(message: string): Observable<AssistantReply> {
    return this.http.post<AssistantReply>(`${this.base}/assistant`, { message });
  }

  setQuantity(mealId: number, quantityEaten: QuantityEaten): Observable<ServiceItem> {
    return this.http.put<ServiceItem>(`${this.base}/meals/${mealId}/quantity`, { quantityEaten });
  }

  changeMealLocation(residentId: number, mealLocation: MealLocation): Observable<ResidentCard> {
    return this.http.put<ResidentCard>(`${this.base}/residents/${residentId}/meal-location`, {
      mealLocation,
    });
  }

  identify(code: string): Observable<Pick<ResidentCard, 'id' | 'firstName' | 'lastName' | 'age' | 'room' | 'photoUrl' | 'distinguishingFeatures'>> {
    return this.http.post<Pick<ResidentCard, 'id' | 'firstName' | 'lastName' | 'age' | 'room' | 'photoUrl' | 'distinguishingFeatures'>>(`${environment.apiUrl}/api/identification/bracelet`, { code });
  }

  /** Identifiants des résidents qui ont un bracelet (NFC ou QR code). */
  bracelets(): Observable<number[]> {
    return this.http.get<number[]>(`${this.base}/bracelets`);
  }

  /** Chevalet du résident, ou null s'il n'en a pas (le serveur répond 204). */
  chevalet(residentId: number): Observable<Chevalet | null> {
    return this.http.get<Chevalet | null>(`${this.base}/residents/${residentId}/chevalet`);
  }

  associateChevalet(code: string, residentId: number, replace = false): Observable<Chevalet> {
    return this.http.post<Chevalet>(`${this.base}/chevalets/associate`, { code, residentId, replace });
  }

  releaseChevalet(residentId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/residents/${residentId}/chevalet`);
  }

  /** Salle à manger : tables, résidents et repas du jour (DEJEUNER ou DINER). */
  assignDiningChevalet(residentId: number, number: string): Observable<void> {
    return this.http.put<void>(`${this.base}/dining/chevalets/${residentId}`, { number });
  }

  releaseDiningChevalet(residentId: number, number: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/dining/chevalets/${residentId}/${encodeURIComponent(number)}`);
  }

  dining(slot?: DiningSlot): Observable<Dining> {
    return this.http.get<Dining>(`${this.base}/dining/tables`, { params: slot ? { slot } : {} });
  }

  /** Lecture d'un bracelet par le lecteur d'une table (ici simulée à partir de l'identifiant du résident). */
  sendReading(readerCode: string, residentId: number, leaving = false): Observable<Reading> {
    return this.http.post<Reading>(`${this.base}/dining/readings`, { readerCode, residentId, leaving });
  }

  /** Menu de la semaine qui contient la date (AAAA-MM-JJ), par défaut cette semaine. */
  weeklyMenu(date?: string): Observable<WeeklyMenu> {
    return this.http.get<WeeklyMenu>(`${this.base}/dining/menu`, { params: date ? { date } : {} });
  }

  access(): Observable<{ diningOnly: boolean; medicationAccess: boolean }> {
    return this.http.get<{ diningOnly: boolean; medicationAccess: boolean }>(`${this.base}/access`);
  }

  team(): Observable<Team> {
    return this.http.get<Team>(`${this.base}/team`);
  }

  checkIn(): Observable<Team> {
    return this.http.post<Team>(`${this.base}/team/check-in`, {});
  }

  checkOut(): Observable<Team> {
    return this.http.post<Team>(`${this.base}/team/check-out`, {});
  }

  myAssignments(): Observable<ScheduledAssignment[]> {
    return this.http.get<ScheduledAssignment[]>(`${this.base}/my-assignments`);
  }

  planning(): Observable<Planning> {
    return this.http.get<Planning>(`${this.base}/planning`);
  }

  notes(residentId?: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/notes`, {
      params: residentId === undefined ? {} : { residentId },
    });
  }

  addNote(content: string, category: NoteCategory, residentId?: number): Observable<Note> {
    return this.http.post<Note>(`${this.base}/notes`, { content, category, residentId: residentId ?? null });
  }

  /** Envoi d'une photo de résident (réservé à l'administrateur). */
  uploadPhoto(residentId: number, photo: File): Observable<{ photoUrl: string }> {
    const body = new FormData();
    body.append('photo', photo, photo.name);
    return this.http.post<{ photoUrl: string }>(`${this.base}/residents/${residentId}/photo`, body);
  }

  listResidents(): Observable<ResidentCard[]> {
    return this.http.get<ResidentCard[]>(`${this.base}/residents`);
  }

  scanPochette(photo: File): Observable<PochetteScan> {
    const body = new FormData();
    body.append('photo', photo, photo.name);
    return this.http.post<PochetteScan>(`${this.base}/identify/pochette`, body);
  }

  openDoubts(): Observable<Doubt[]> {
    return this.http.get<Doubt[]>(`${this.base}/identity-doubts`);
  }

  reportDoubt(residentId: number, note: string): Observable<Doubt> {
    return this.http.post<Doubt>(`${this.base}/identity-doubts`, { residentId, note });
  }

  resolveDoubt(doubtId: number): Observable<Doubt> {
    return this.http.post<Doubt>(`${this.base}/identity-doubts/${doubtId}/resolve`, {});
  }
}

/** Message lisible à afficher à partir d'une erreur HTTP (le backend renvoie { message }). */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message) {
      return message;
    }
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez la connexion.';
    }
    if (error.status === 403) {
      return "Vous n'avez pas le droit d'effectuer cette action.";
    }
  }
  return 'Une erreur est survenue. Réessayez.';
}
