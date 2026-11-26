import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Allergy,
  AllergyRequest,
  DietaryRegime,
  DietaryRegimeRequest,
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

  findAllergiesByResidentId(residentId: number): Observable<Allergy[]> {
    return this.http.get<Allergy[]>(`${this.residentsUrl}/${residentId}/allergies`);
  }

  createAllergy(residentId: number, request: AllergyRequest): Observable<Allergy> {
    return this.http.post<Allergy>(`${this.residentsUrl}/${residentId}/allergies`, request);
  }

  updateAllergy(
    residentId: number,
    allergyId: number,
    request: AllergyRequest,
  ): Observable<Allergy> {
    return this.http.put<Allergy>(
      `${this.residentsUrl}/${residentId}/allergies/${allergyId}`,
      request,
    );
  }

  deleteAllergy(residentId: number, allergyId: number): Observable<void> {
    return this.http.delete<void>(`${this.residentsUrl}/${residentId}/allergies/${allergyId}`);
  }

  findDietaryRegimesByResidentId(residentId: number): Observable<DietaryRegime[]> {
    return this.http.get<DietaryRegime[]>(`${this.residentsUrl}/${residentId}/dietary-regimes`);
  }

  createDietaryRegime(
    residentId: number,
    request: DietaryRegimeRequest,
  ): Observable<DietaryRegime> {
    return this.http.post<DietaryRegime>(
      `${this.residentsUrl}/${residentId}/dietary-regimes`,
      request,
    );
  }

  updateDietaryRegime(
    residentId: number,
    regimeId: number,
    request: DietaryRegimeRequest,
  ): Observable<DietaryRegime> {
    return this.http.put<DietaryRegime>(
      `${this.residentsUrl}/${residentId}/dietary-regimes/${regimeId}`,
      request,
    );
  }

  deleteDietaryRegime(residentId: number, regimeId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.residentsUrl}/${residentId}/dietary-regimes/${regimeId}`,
    );
  }
}
