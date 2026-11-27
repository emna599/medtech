import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DiningSlot, PLATE_STATUS_LABEL, PlateStatus } from '../../../shared/models/personnel.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';

interface Plate {
  id: number;
  room: string | null;
  texture: string | null;
  regime: string | null;
  allergens: string[];
  restrictions: string | null;
  instructions: string | null;
  textureConflict: boolean;
  version: string;
  status: PlateStatus;
}

@Component({
  selector: 'app-kitchen',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="work-page kitchen">
      <header class="page-head">
        <h1>Cuisine</h1>
        <button mat-button type="button" (click)="pointage.emit()">Pointage RFID</button>
        <button mat-stroked-button (click)="load()" [disabled]="busy()">Actualiser</button>
      </header>
      <mat-button-toggle-group class="slot" aria-label="Repas à préparer" [hideSingleSelectionIndicator]="true"
        [value]="slot()" (change)="slot.set($event.value); load()">
        <mat-button-toggle value="DEJEUNER" [disabled]="busy()">
          <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">wb_sunny</mat-icon>
          Déjeuner
        </mat-button-toggle>
        <mat-button-toggle value="DINER" [disabled]="busy()">
          <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">dark_mode</mat-icon>
          Dîner
        </mat-button-toggle>
      </mat-button-toggle-group>
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (notice()) { <p role="status">{{ notice() }}</p> }
      <section aria-labelledby="plates-heading">
        <h2 id="plates-heading">Plateaux du jour</h2>
        <ul>
          @for (plate of plates(); track plate.id) {
            <li>
              <div>
                <strong>Plateau {{ plate.id }}</strong>
                <span> · {{ plate.room ? 'Chambre ' + plate.room : 'Chambre non renseignée' }}</span>
              </div>
              <div>{{ plate.texture || 'Texture à renseigner' }} · {{ plate.regime || 'Régime à renseigner' }}</div>
              @if (plate.allergens.length) { <strong class="danger">À éviter · {{ plate.allergens.join(', ') }}</strong> }
              @if (plate.textureConflict) { <strong class="danger">Textures contradictoires</strong> }
              @if (plate.restrictions) { <span>Restrictions · {{ plate.restrictions }}</span> }
              @if (plate.instructions) { <span>Consignes · {{ plate.instructions }}</span> }
              <span class="work-status" [class.work-alert-danger]="plate.status === 'A_REVERIFIER'">{{ labels[plate.status] }}</span>
              @if (plate.status === 'A_PREPARER' || plate.status === 'A_REVERIFIER') {
                <button mat-flat-button [disabled]="busy() || plate.textureConflict" (click)="check(plate)">
                  {{ plate.status === 'A_REVERIFIER' ? 'Confirmer la correction' : 'Confirmer la préparation' }}
                </button>
              }
            </li>
          } @empty {
            @if (!busy()) { <li>Aucun plateau à traiter pour ce créneau.</li> }
          }
        </ul>
      </section>
      <details>
        <summary>Publier un menu</summary>
        <form #form="ngForm" (ngSubmit)="publish()">
          <label>Date <input type="date" name="date" [(ngModel)]="menu.date" required></label>
          <label>Repas <select name="slot" [(ngModel)]="menu.slot"><option value="DEJEUNER">Déjeuner</option><option value="DINER">Dîner</option></select></label>
          <label>Entrée <input name="starter" [(ngModel)]="menu.starter" maxlength="150"></label>
          <label>Plat <input name="main" [(ngModel)]="menu.main" maxlength="150" required></label>
          <label>Accompagnement <input name="side" [(ngModel)]="menu.side" maxlength="150"></label>
          <label>Dessert <input name="dessert" [(ngModel)]="menu.dessert" maxlength="150"></label>
          <button mat-flat-button [disabled]="form.invalid || busy()">Publier le menu</button>
        </form>
      </details>
    </main>
  `,
  styles: `
    .kitchen { display: grid; gap: 16px; }
    h2 { margin-block: 0 12px; }
    .kitchen :is(section, details) { border: 1px solid var(--app-line); background: var(--app-surface); padding: 16px; border-radius: var(--control-radius); }
    summary { cursor: pointer; font-weight: 700; padding-block: 6px; }
    details form { margin-block-start: 12px; }
    label, li { display: grid; gap: 6px; min-width: 0; }
    .slot { justify-self: start; }
    input, select { min-height: 44px; padding-inline: 8px; background: var(--app-surface); color: var(--app-ink); border: 1px solid var(--control-outline); border-radius: var(--control-radius); font: inherit; min-width: 0; }
    ul, form { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 12px; margin: 0; padding: 0; }
    li { border-top: 1px solid var(--app-line); padding-block: 10px; overflow-wrap: anywhere; }
    button, .work-status { justify-self: start; }
    .danger, [role="alert"] { color: var(--app-danger); }
  `,
})
export class Kitchen {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly base = `${environment.apiUrl}/api/kitchen`;
  readonly pointage = output<void>();

  protected readonly labels = PLATE_STATUS_LABEL;
  protected readonly slot = signal<DiningSlot>('DEJEUNER');
  protected readonly plates = signal<Plate[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly menu = { date: '', slot: 'DEJEUNER' as DiningSlot, starter: '', main: '', side: '', dessert: '' };

  constructor() { this.load(); }

  protected load(): void {
    this.run(this.http.get<Plate[]>(`${this.base}/plates`, { params: { slot: this.slot() } }),
      plates => this.plates.set(plates));
  }

  protected check(plate: Plate): void {
    this.run(this.http.put<Plate>(`${this.base}/plates/${plate.id}`, { version: plate.version }), updated => {
      this.plates.update(rows => rows.map(row => row.id === updated.id ? updated : row));
    });
  }

  protected publish(): void {
    this.run(this.http.put<void>(`${this.base}/menu`, this.menu), () => this.notice.set('Menu publié.'));
  }

  private run<T>(request: Observable<T>, onSuccess: (value: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: onSuccess,
      error: err => this.error.set(apiErrorMessage(err, 'La demande Cuisine a échoué.')),
    });
  }
}
