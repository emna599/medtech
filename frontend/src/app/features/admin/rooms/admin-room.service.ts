import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Room, RoomPayload } from '../../../shared/models/room.model';

@Injectable({ providedIn: 'root' })
export class AdminRoomService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/rooms`;

  list(): Observable<Room[]> {
    return this.http.get<Room[]>(this.baseUrl);
  }

  create(payload: RoomPayload): Observable<Room> {
    return this.http.post<Room>(this.baseUrl, payload);
  }

  update(id: number, payload: RoomPayload): Observable<Room> {
    return this.http.put<Room>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
