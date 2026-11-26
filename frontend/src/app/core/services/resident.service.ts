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
  QrCode,
  QrResidentInfo,
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

  saveMedicalRecord(id: number, request: Pick<MedicalRecord, 'history' | 'treatments'> & { version: number | null }): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(`${this.residentsUrl}/${id}/medical-record`, request);
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

  deleteAllergy(residentId: number, allergyId: number, version: number): Observable<void> {
    return this.http.delete<void>(`${this.residentsUrl}/${residentId}/allergies/${allergyId}`, { params: { version } });
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

  deleteDietaryRegime(residentId: number, regimeId: number, version: number): Observable<void> {
    return this.http.delete<void>(
      `${this.residentsUrl}/${residentId}/dietary-regimes/${regimeId}`,
      { params: { version } },
    );
  }

  findQrCodesByResidentId(residentId: number): Observable<QrCode[]> {
    return this.http.get<QrCode[]>(`${this.residentsUrl}/${residentId}/qr-codes`);
  }

  findResidentByQrToken(token: string): Observable<QrResidentInfo> {
    return this.http.get<QrResidentInfo>(
      `${environment.apiUrl}/api/qr-codes/${encodeURIComponent(token)}`,
    );
  }

  generateQrCode(residentId: number, activeQrCodeId?: number): Observable<QrCode> {
    const params: Record<string, number> = activeQrCodeId === undefined ? {} : { activeQrCodeId };
    return this.http.post<QrCode>(`${this.residentsUrl}/${residentId}/qr-codes`, {}, { params });
  }

  deactivateQrCode(residentId: number, qrCodeId: number): Observable<QrCode> {
    return this.http.put<QrCode>(
      `${this.residentsUrl}/${residentId}/qr-codes/${qrCodeId}/deactivate`,
      {},
    );
  }
}
