import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ResidentDetail, ageFrom, stayDuration } from '../../models/resident.model';

@Component({
  selector: 'app-resident-overview',
  imports: [DatePipe, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = resident();
    <header class="page-head">
      <div class="identity">
        <span class="initials" aria-hidden="true">{{ initials() }}</span>
        <div>
          <h1>{{ r.firstName }} {{ r.lastName }}</h1>
          <p><span class="work-status" [class.inactive]="!r.active">{{ r.active ? 'Actif' : 'Inactif' }}</span></p>
        </div>
      </div>
      <ng-content />
    </header>
    <section aria-labelledby="resident-overview-title">
      <h2 id="resident-overview-title">Identité et séjour</h2>
      <mat-card appearance="outlined" class="work-card">
        <mat-card-content>
          <dl>
            <div><dt>Date de naissance</dt><dd>{{ r.birthDate | date:'dd/MM/yyyy' }} · {{ age() }} ans</dd></div>
            <div><dt>Date d’admission</dt><dd>{{ (r.admissionDate | date:'dd/MM/yyyy') ?? 'Non renseignée' }}</dd></div>
            @if (r.active && r.admissionDate) {
              <div><dt>Durée du séjour</dt><dd>{{ duration() }}</dd></div>
            }
            <div><dt>Chambre</dt><dd>{{ r.roomNumber ?? 'Sans chambre' }}@if (r.floor !== null) { · Étage {{ r.floor }} }</dd></div>
          </dl>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: `
    .identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .identity h1 { overflow-wrap: anywhere; }
    .initials { display: grid; place-items: center; flex: 0 0 48px; height: 48px;
      border-radius: 8px; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .page-head p { margin-top: 8px; }
    h2 { margin: 0 0 12px; font: var(--mat-sys-title-large); }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 16px; margin: 0; }
    dt { color: var(--mat-sys-on-surface-variant); }
    dd { margin: 4px 0 0; font-weight: 600; overflow-wrap: anywhere; }
  `,
})
export class ResidentOverview {
  readonly resident = input.required<ResidentDetail>();
  protected readonly initials = computed(() => {
    const { firstName, lastName } = this.resident();
    return [firstName, lastName].map(name => name.slice(0, 1)).join('').toUpperCase();
  });
  protected readonly age = computed(() => ageFrom(this.resident().birthDate));
  protected readonly duration = computed(() => {
    const date = this.resident().admissionDate;
    return date ? stayDuration(date) : null;
  });
}
