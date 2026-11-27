import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ServiceItem } from '../../shared/models/personnel.model';
import { errorMessage, PersonnelService } from './personnel.service';

const BASE = `${environment.apiUrl}/api/personnel`;

describe('PersonnelService', () => {
  let service: PersonnelService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PersonnelService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for the meals of the day', () => {
    service.listService('REPAS').subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/service`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('kind')).toBe('REPAS');
    req.flush([]);
  });

  it('completes a meal on the meals route and a medication on the doses route', () => {
    service.completeById('REPAS', 5, { status: 'FAIT' }).subscribe();
    const meal = http.expectOne(`${BASE}/meals/5/complete`);
    expect(meal.request.method).toBe('POST');
    expect(meal.request.body).toEqual({ status: 'FAIT' });
    meal.flush({} as ServiceItem);

    service.completeById('MEDICAMENT', 9, { status: 'REFUSE', comment: 'Nausées' }).subscribe();
    const dose = http.expectOne(`${BASE}/doses/9/complete`);
    expect(dose.request.body).toEqual({ status: 'REFUSE', comment: 'Nausées' });
    dose.flush({} as ServiceItem);
  });

  it('sends the quantity eaten', () => {
    service.setQuantity(3, 'MOITIE').subscribe();
    const req = http.expectOne(`${BASE}/meals/3/quantity`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantityEaten: 'MOITIE' });
    req.flush({});
  });

  it('identifies a resident by code and asks the assistant', () => {
    service.identify('DEMO-001').subscribe();
    http.expectOne('/api/identification/bracelet').flush({});

    service.ask('Résumé du service').subscribe();
    const ask = http.expectOne(`${BASE}/assistant`);
    expect(ask.request.body).toEqual({ message: 'Résumé du service' });
    ask.flush({});
  });

  it('sends the photo of a pochette as a multipart form', () => {
    const file = new File(['x'], 'pochette.jpg', { type: 'image/jpeg' });
    service.scanPochette(file).subscribe();
    const req = http.expectOne(`${BASE}/identify/pochette`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('photo')).toBeTruthy();
    req.flush({ status: 'UNAVAILABLE', message: '', resident: null });
  });

  it('asks for the appetite over 7 days by default', () => {
    service.appetite(4).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/residents/4/appetite`);
    expect(req.request.params.get('days')).toBe('7');
    req.flush({});
  });
});

describe('errorMessage', () => {
  it('uses the message sent by the backend', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Déjà servi' } });
    expect(errorMessage(error)).toBe('Déjà servi');
  });

  it('explains a missing connection and a forbidden action', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('injoignable');
    expect(errorMessage(new HttpErrorResponse({ status: 403 }))).toContain('pas le droit');
  });

  it('falls back to a generic message', () => {
    expect(errorMessage(new Error('boom'))).toBe('Une erreur est survenue. Réessayez.');
  });
});
