import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MedicalRecord,
  ResidentDetail,
  ResidentSummary,
} from '../../shared/models/resident.model';

@Injectable({ providedIn: 'root' })
export class ResidentService {
  private readonly http = inject(HttpClient);
  private readonly residentsUrl = `${environment.apiUrl}/api/residents`;

  findAll(): Observable<ResidentSummary[]> {
    return this.http.get<ResidentSummary[]>(this.residentsUrl);
  }

  findById(id: number): Observable<ResidentDetail> {
    return this.http.get<ResidentDetail>(`${this.residentsUrl}/${id}`);
  }

  findMedicalRecordByResidentId(id: number): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.residentsUrl}/${id}/medical-record`);
  }
}
