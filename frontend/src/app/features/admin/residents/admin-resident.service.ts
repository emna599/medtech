import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Resident, ResidentPayload } from '../../../shared/models/resident.model';

export interface ResidentCoordination {
  roomMealService: boolean;
  assistanceCoordination: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminResidentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/residents`;

  list(search = '', active: boolean | null = null): Observable<Resident[]> {
    let params = new HttpParams();
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    if (active !== null) {
      params = params.set('active', active);
    }
    return this.http.get<Resident[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Resident> {
    return this.http.get<Resident>(`${this.baseUrl}/${id}`);
  }

  coordination(id: number): Observable<ResidentCoordination> {
    return this.http.get<ResidentCoordination>(`${this.baseUrl}/${id}/coordination`);
  }

  /** Résidents actifs d'une chambre. */
  byRoom(roomId: number): Observable<Resident[]> {
    const params = new HttpParams().set('roomId', roomId).set('active', true);
    return this.http.get<Resident[]>(this.baseUrl, { params });
  }

  create(payload: ResidentPayload): Observable<Resident> {
    return this.http.post<Resident>(this.baseUrl, payload);
  }

  update(id: number, payload: ResidentPayload): Observable<Resident> {
    return this.http.put<Resident>(`${this.baseUrl}/${id}`, payload);
  }
}
