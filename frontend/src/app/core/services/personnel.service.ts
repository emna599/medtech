import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Appetite,
  AssistantReply,
  CompleteRequest,
  Doubt,
  HandoverAction,
  HandoverBoard,
  HandoverRequest,
  MealLocation,
  PochetteScan,
  QuantityEaten,
  ResidentCard,
  ServiceItem,
  ServiceKind,
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

  completeHandover(id: number): Observable<HandoverAction> {
    return this.http.post<HandoverAction>(`${this.handover}/${id}/complete`, {});
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

  identify(code: string): Observable<ResidentCard> {
    return this.http.post<ResidentCard>(`${this.base}/identify`, { code });
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
