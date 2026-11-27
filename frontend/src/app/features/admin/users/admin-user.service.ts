import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminUser, CreateUserPayload, UpdateUserPayload } from '../../../shared/models/user.model';

export interface StaffAssignment {
  id: number;
  floor: number;
  startsAt: string;
  endsAt: string;
  revokedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/users`;

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.baseUrl);
  }

  create(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateUserPayload): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${id}`, payload);
  }

  assignments(id: number): Observable<StaffAssignment[]> {
    return this.http.get<StaffAssignment[]>(`${this.baseUrl}/${id}/assignments`);
  }

  grantAssignment(id: number, floor: number, startsAt: string, endsAt: string): Observable<StaffAssignment[]> {
    return this.http.post<StaffAssignment[]>(`${this.baseUrl}/${id}/assignments`, { floor, startsAt, endsAt });
  }

  revokeAssignment(id: number, assignmentId: number): Observable<StaffAssignment[]> {
    return this.http.delete<StaffAssignment[]>(`${this.baseUrl}/${id}/assignments/${assignmentId}`);
  }

  replaceAssignment(id: number, assignmentId: number, substituteId: number): Observable<StaffAssignment[]> {
    return this.http.post<StaffAssignment[]>(
      `${this.baseUrl}/${id}/assignments/${assignmentId}/replacement`, { substituteId },
    );
  }

  resetPassword(id: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/password`, { password });
  }
}
