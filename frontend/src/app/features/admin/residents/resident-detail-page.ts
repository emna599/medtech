import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Resident, ageFrom, stayDuration } from '../../../shared/models/resident.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminResidentService } from './admin-resident.service';
import { ResidentFormDialog } from './resident-form-dialog';

/** Fiche détaillée d'un résident : identité, séjour, chambre et voisins de chambre. */
@Component({
  selector: 'app-resident-detail-page',
  imports: [DatePipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a mat-button routerLink="/admin/residents" class="back">
      <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon> Résidents
    </a>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (resident(); as r) {
      <header class="page-head">
        <div class="identity">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <div>
            <h1>{{ r.firstName }} {{ r.lastName }}</h1>
            <p>
              <span class="badge" [class.off]="!r.active">{{ r.active ? 'Résident actif' : 'Résident inactif' }}</span>
            </p>
          </div>
        </div>
        <button mat-flat-button type="button" (click)="edit(r)">
          <mat-icon fontSet="material-symbols-outlined">edit</mat-icon> Modifier
        </button>
      </header>

      <section class="grid">
        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Identité</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl>
              <dt>Nom</dt><dd>{{ r.lastName }}</dd>
              <dt>Prénom</dt><dd>{{ r.firstName }}</dd>
              <dt>Date de naissance</dt><dd>{{ r.birthDate | date: 'dd/MM/yyyy' }}</dd>
              <dt>Âge</dt><dd>{{ age() }} ans</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Séjour</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl>
              <dt>Date d'admission</dt><dd>{{ r.admissionDate | date: 'dd/MM/yyyy' }}</dd>
              <dt>Durée du séjour</dt><dd>{{ stay() }}</dd>
              <dt>État</dt><dd>{{ r.active ? 'Actif' : 'Inactif' }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" [class.card-alert]="r.active && !r.roomNumber">
          <mat-card-header><mat-card-title>Chambre</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (r.roomNumber) {
              <dl>
                <dt>Chambre</dt><dd>{{ r.roomNumber }}</dd>
                <dt>Étage</dt><dd>{{ r.floor }}</dd>
              </dl>
              <h3>Occupants de la chambre</h3>
              @for (mate of roommates(); track mate.id) {
                <p class="mate">
                  <mat-icon fontSet="material-symbols-outlined">person</mat-icon>
                  <a class="link" [routerLink]="['/admin/residents', mate.id]">{{ mate.firstName }} {{ mate.lastName }}</a>
                </p>
              } @empty {
                <p class="muted">Seul(e) dans la chambre.</p>
              }
            } @else {
              <p class="alert">
                <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
                {{ r.active ? 'Aucune chambre attribuée.' : 'Pas de chambre (résident inactif).' }}
              </p>
              @if (r.active) {
                <button mat-flat-button type="button" (click)="edit(r)">Attribuer une chambre</button>
              }
            }
          </mat-card-content>
        </mat-card>
      </section>
    }
  `,
  styles: `
    .back { margin-bottom: 8px; }
    .identity { display: flex; align-items: center; gap: 16px; }
    .avatar { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); font: var(--mat-sys-title-large); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 12px 0 0; }
    dt { color: var(--mat-sys-on-surface-variant); }
    dd { margin: 0; font-weight: 500; text-align: right; }
    h3 { font: var(--mat-sys-title-small); margin: 20px 0 4px; }
    .mate { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
    .alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .card-alert { border-color: var(--mat-sys-error); }
    .muted { color: var(--mat-sys-on-surface-variant); }
  `,
})
export class ResidentDetailPage {
  private readonly service = inject(AdminResidentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly resident = signal<Resident | null>(null);
  protected readonly roommates = signal<Resident[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly age = computed(() => {
    const r = this.resident();
    return r ? ageFrom(r.birthDate) : 0;
  });
  protected readonly stay = computed(() => {
    const r = this.resident();
    return r ? stayDuration(r.admissionDate) : '';
  });
  protected readonly initials = computed(() => {
    const r = this.resident();
    return r ? `${r.firstName[0] ?? ''}${r.lastName[0] ?? ''}`.toUpperCase() : '';
  });

  constructor() {
    this.load();
  }

  protected edit(resident: Resident): void {
    this.dialog
      .open(ResidentFormDialog, { data: resident })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open('Résident modifié', 'OK', { duration: 3000 });
          this.load();
        }
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.get(this.id).subscribe({
      next: (resident) => {
        this.resident.set(resident);
        this.loading.set(false);
        this.loadRoommates(resident);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Résident introuvable'));
        this.loading.set(false);
      },
    });
  }

  private loadRoommates(resident: Resident): void {
    if (resident.roomId === null) {
      this.roommates.set([]);
      return;
    }
    this.service.byRoom(resident.roomId).subscribe({
      next: (list) => this.roommates.set(list.filter((r) => r.id !== resident.id)),
      error: () => this.roommates.set([]),
    });
  }
}
