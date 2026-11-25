import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Appetite } from '../../../shared/models/personnel.model';
import { AppetiteChart } from './appetite-chart';

const URL = `${environment.apiUrl}/api/personnel/residents/7/appetite`;

function appetite(declining: boolean): Appetite {
  const scores = [1, 0.75, 1, 0.25, 0, 0.25, null];
  return {
    days: scores.map((score, i) => ({ date: `2026-11-${String(18 + i).padStart(2, '0')}`, score, meals: 2, refused: 0 })),
    recentAverage: 0.17,
    previousAverage: 0.9,
    declining,
  };
}

describe('AppetiteChart', () => {
  let http: HttpTestingController;

  function create() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AppetiteChart);
    fixture.componentRef.setInput('residentId', 7);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('draws one bar per day and warns when appetite is declining', async () => {
    const fixture = create();
    http.expectOne((r) => r.url === URL).flush(appetite(true));
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.col').length).toBe(7);
    expect(element.querySelector('.box-alert')).not.toBeNull();
    expect(element.textContent).toContain('en baisse');
  });

  it('shows no alert when appetite is stable', async () => {
    const fixture = create();
    http.expectOne((r) => r.url === URL).flush(appetite(false));
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.box-alert')).toBeNull();
    expect(element.textContent).toContain('stable');
  });

  it('shows nothing when the request fails', async () => {
    const fixture = create();
    http.expectOne((r) => r.url === URL).flush('erreur', { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.box')).toBeNull();
  });
});
