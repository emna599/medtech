import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, Observable } from 'rxjs';
import { AdminUser } from '../../../shared/models/user.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminUserService, StaffAssignment } from './admin-user.service';

@Component({
  selector: 'app-assignment-dialog',
  imports: [DatePipe, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Affectations de {{ user.fullName }}</h2>
    <mat-dialog-content>
      <form class="fields" #form="ngForm" (ngSubmit)="grant()">
        <mat-form-field appearance="outline">
          <mat-label>Étage</mat-label>
          <input matInput type="number" step="1" name="floor" [(ngModel)]="floor" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Début du créneau (heure locale)</mat-label>
          <input matInput type="datetime-local" name="start" [(ngModel)]="startsAt" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fin du créneau (heure locale)</mat-label>
          <input matInput type="datetime-local" name="end" [(ngModel)]="endsAt" required />
        </mat-form-field>
        <button mat-flat-button type="submit" [disabled]="form.invalid || busy()">Enregistrer le brouillon</button>
      </form>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      <ul>
        @for (entry of entries(); track entry.id) {
          <li>
            <strong>Étage {{ entry.floor }}</strong>
            <span>Du {{ entry.startsAt | date:'dd/MM/yyyy HH:mm' }} au {{ entry.endsAt | date:'dd/MM/yyyy HH:mm' }}</span>
            @if (entry.revokedAt) {
              <span>Retirée le {{ entry.revokedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            } @else if (expired(entry)) {
              <span>Expirée</span>
            } @else {
              <span>{{ entry.publishedAt ? 'Publié' : 'Brouillon' }}</span>
              @if (!entry.publishedAt) {
                <button mat-flat-button type="button" [disabled]="busy()" (click)="publish(entry)">Publier</button>
              }
              <button mat-stroked-button type="button" [disabled]="busy()" (click)="revoke(entry)">Retirer</button>
              @if (replacementFor() === entry.id) {
                <mat-form-field appearance="outline">
                  <mat-label>Remplaçant de même fonction</mat-label>
                  <mat-select [(value)]="substituteId">
                    @for (candidate of candidates; track candidate.id) {
                      <mat-option [value]="candidate.id">{{ candidate.fullName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-flat-button type="button" [disabled]="busy() || substituteId === null" (click)="replace(entry)">
                  Confirmer le remplacement
                </button>
                <button mat-button type="button" (click)="replacementFor.set(null)">Annuler</button>
              } @else if (entry.publishedAt && candidates.length) {
                <button mat-button type="button" [disabled]="busy()" (click)="chooseReplacement(entry)">Remplacer</button>
              }
            }
          </li>
        } @empty {
          <li>Aucune affectation enregistrée.</li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: `
    .fields, li { display: grid; gap: 8px; }
    .fields button, li button { justify-self: start; }
    ul { padding: 0; list-style: none; }
    li { border-top: 1px solid var(--app-line); padding-block: 8px; }
  `,
})
export class AssignmentDialog {
  private readonly data = inject<{ user: AdminUser; candidates: AdminUser[] }>(MAT_DIALOG_DATA);
  protected readonly user = this.data.user;
  protected readonly candidates = this.data.candidates;
  protected readonly replacementFor = signal<number | null>(null);
  protected substituteId: number | null = null;
  private readonly api = inject(AdminUserService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly entries = signal<StaffAssignment[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected floor: number | null = null;
  protected startsAt = '';
  protected endsAt = '';

  constructor() {
    this.refresh(this.api.assignments(this.user.id));
  }

  protected grant(): void {
    const start = new Date(this.startsAt);
    const end = new Date(this.endsAt);
    if (this.floor === null || !Number.isInteger(this.floor) || !(start < end)) {
      this.error.set('Renseignez un étage et une fin postérieure au début.');
      return;
    }
    this.refresh(this.api.grantAssignment(this.user.id, this.floor, start.toISOString(), end.toISOString()));
  }

  protected revoke(entry: StaffAssignment): void {
    this.refresh(this.api.revokeAssignment(this.user.id, entry.id));
  }

  protected publish(entry: StaffAssignment): void {
    this.refresh(this.api.publishAssignment(this.user.id, entry.id));
  }

  protected chooseReplacement(entry: StaffAssignment): void {
    this.substituteId = null;
    this.replacementFor.set(entry.id);
  }

  protected replace(entry: StaffAssignment): void {
    if (this.substituteId === null) return;
    this.refresh(this.api.replaceAssignment(this.user.id, entry.id, this.substituteId));
  }

  protected expired(entry: StaffAssignment): boolean {
    return Date.parse(entry.endsAt) <= Date.now();
  }

  private refresh(request: Observable<StaffAssignment[]>): void {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: entries => this.entries.set(entries),
      error: err => this.error.set(apiErrorMessage(err, 'Impossible de charger ou de modifier les affectations.')),
    });
  }
}
