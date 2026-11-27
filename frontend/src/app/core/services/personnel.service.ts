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
  Me,
  Note,
  NoteCategory,
  Planning,
  MealLocation,
  PochetteScan,
  QuantityEaten,
  ResidentCard,
  ServiceItem,
  ServiceKind,
  Team,
  WeeklyMenu,
} from '../../shared/models/personnel.model';

/** Appels vers l'API de l'espace personnel (le jeton est ajouté par l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/personnel`;

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

  identify(code: string): Observable<ResidentCard> {
    return this.http.post<ResidentCard>(`${this.base}/identify`, { code });
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
  dining(slot?: DiningSlot): Observable<Dining> {
    return this.http.get<Dining>(`${this.base}/dining/tables`, { params: slot ? { slot } : {} });
  }

  /** Lecture d'un bracelet par le lecteur d'une table (ici simulée à partir de l'identifiant du résident). */
  sendReading(readerCode: string, residentId: number | null, leaving = false, token?: string): Observable<Reading> {
    return this.http.post<Reading>(`${this.base}/dining/readings`, { readerCode, residentId, token, leaving });
  }

  /** Associe une carte NFC (numéro de série lu par le téléphone) à un résident. */
  linkNfc(residentId: number, token: string): Observable<ResidentCard> {
    return this.http.post<ResidentCard>(`${this.base}/residents/${residentId}/nfc`, { token });
  }

  /** Menu de la semaine qui contient la date (AAAA-MM-JJ), par défaut cette semaine. */
  weeklyMenu(date?: string): Observable<WeeklyMenu> {
    return this.http.get<WeeklyMenu>(`${this.base}/dining/menu`, { params: date ? { date } : {} });
  }

  me(): Observable<Me> {
    return this.http.get<Me>(`${this.base}/me`);
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
