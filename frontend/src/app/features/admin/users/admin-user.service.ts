import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminUser, CreateUserPayload, UpdateUserPayload } from '../../../shared/models/user.model';

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

  resetPassword(id: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/password`, { password });
  }
}
