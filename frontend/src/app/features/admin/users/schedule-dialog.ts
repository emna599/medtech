import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { JOB_LABEL, SHIFT_LABEL, Shift } from '../../../shared/models/personnel.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminUserService, ScheduleOverview, ScheduledStaff } from './admin-user.service';

@Component({
  selector: 'app-schedule-dialog',
  imports: [DatePipe, FormsModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Planning de l’équipe</h2>
    <mat-dialog-content>
      <div class="filters">
        <label>Jour <input type="date" [ngModel]="date()" (ngModelChange)="setDate($event)" [disabled]="busy()"></label>
        <label>Équipe
          <select [ngModel]="shift()" (ngModelChange)="shift.set($event)">
            <option value="">Jour et nuit</option><option value="JOUR">Jour</option><option value="NUIT">Nuit</option>
          </select>
        </label>
      </div>
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (!busy() && overview() && !error() && withoutPublished().length) {
        <p>Étages sans affectation publiée pour cette sélection : {{ withoutPublished().join(', ') }}.</p>
      }
      <ul>
        @for (row of rows(); track row.id) {
          <li>
            <strong>{{ row.name }}</strong>
            <span>{{ jobs[row.job] }} · {{ shifts[row.shift] }} · Étage {{ row.floor }}</span>
            <span>{{ row.startsAt | date:'dd/MM HH:mm' }} → {{ row.endsAt | date:'dd/MM HH:mm' }}</span>
            @if (row.publishedAt) {
              <span>Publié</span>
            } @else {
              <button mat-flat-button [disabled]="busy()" (click)="publish(row)">Publier le créneau</button>
            }
          </li>
        } @empty {
          @if (!busy() && !error()) { <li>Aucun créneau pour cette sélection.</li> }
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Fermer</button></mat-dialog-actions>
  `,
  styles: `
    .filters { display: flex; flex-wrap: wrap; gap: 12px; }
    label, li { display: grid; gap: 5px; }
    input, select { min-height: 44px; font: inherit; padding-inline: 8px; color: var(--app-ink); background: var(--app-surface); border: 1px solid var(--control-outline); border-radius: var(--control-radius); }
    ul { padding: 0; list-style: none; }
    li { padding-block: 8px; border-top: 1px solid var(--app-line); }
    li button { justify-self: start; }
  `,
})
export class ScheduleDialog {
  private readonly api = inject(AdminUserService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly jobs = JOB_LABEL;
  protected readonly shifts = SHIFT_LABEL;
  protected readonly date = signal(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date()));
  protected readonly shift = signal<Shift | ''>('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly overview = signal<ScheduleOverview | null>(null);
  protected readonly rows = computed(() => (this.overview()?.entries ?? []).filter(row => !this.shift() || row.shift === this.shift()));
  protected readonly withoutPublished = computed(() => (this.overview()?.floors ?? [])
    .filter(floor => !this.rows().some(row => row.floor === floor && row.publishedAt)));

  constructor() { this.load(); }

  protected setDate(date: string): void {
    if (!date) return;
    this.date.set(date);
    this.load();
  }

  protected publish(row: ScheduledStaff): void {
    this.busy.set(true);
    this.error.set('');
    this.api.publishAssignment(row.userId, row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: err => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, 'Publication impossible.'));
      },
    });
  }

  private load(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.schedule(this.date()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: overview => this.overview.set(overview),
      error: err => this.error.set(apiErrorMessage(err, 'Planning indisponible.')),
    });
  }
}
