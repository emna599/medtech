import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { AssistantReply } from '../../../shared/models/personnel.model';
import { AssistantDialog } from './assistant-dialog';

const BASE = `${environment.apiUrl}/personnel`;

const proposal: AssistantReply = {
  answer: 'Je prépare : Déjeuner de Michel DURAND → servi. Confirmez-vous ?',
  intent: 'ACTION',
  residents: [{ id: 2, name: 'Michel DURAND', room: '7' }],
  action: { kind: 'REPAS', itemId: 42, summary: 'Déjeuner de Michel DURAND → servi' },
};

describe('AssistantDialog', () => {
  let http: HttpTestingController;
  const close = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialogRef, useValue: { close } }],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AssistantDialog);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => close.mockClear());
  afterEach(() => http.verify());

  it('sends the question and shows the answer', () => {
    const fixture = create();
    fixture.componentInstance['send']("Qui n'a pas encore mangé ?");

    const req = http.expectOne(`${BASE}/assistant`);
    expect(req.request.body).toEqual({ message: "Qui n'a pas encore mangé ?" });
    req.flush({ answer: '3 repas à servir', intent: 'RESTE_REPAS', residents: [], action: null });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 repas à servir');
  });

  it('ignores an empty question', () => {
    const fixture = create();
    fixture.componentInstance['send']('   ');
    http.expectNone(`${BASE}/assistant`);
  });

  it('records nothing until the nurse confirms, then completes the meal', () => {
    const fixture = create();
    fixture.componentInstance['send']('Marque le repas de M. Durand comme servi');
    http.expectOne(`${BASE}/assistant`).flush(proposal);
    http.expectNone(`${BASE}/meals/42/complete`);
    fixture.detectChanges();

    const confirmation = fixture.componentInstance['messages']().find((m) => m.action);
    fixture.componentInstance['confirm'](confirmation!);
    const req = http.expectOne(`${BASE}/meals/42/complete`);
    expect(req.request.body).toEqual({ status: 'FAIT' });
    req.flush({});

    fixture.componentInstance['close']();
    expect(close).toHaveBeenCalledWith({ changed: true });
  });

  it('opens the resident sheet from a name', () => {
    const fixture = create();
    fixture.componentInstance['openResident'](2);
    expect(close).toHaveBeenCalledWith({ changed: false, residentId: 2 });
  });
});
