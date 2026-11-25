import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../../shared/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  stats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${environment.apiUrl}/api/admin/dashboard`);
  }
}
