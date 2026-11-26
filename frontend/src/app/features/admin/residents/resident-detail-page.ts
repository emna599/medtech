import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ResidentOverview } from '../../../shared/components/resident-overview/resident-overview';
import { Resident } from '../../../shared/models/resident.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminResidentService } from './admin-resident.service';
import { ResidentBracelet } from './resident-bracelet';
import { ResidentFormDialog } from './resident-form-dialog';

@Component({
  selector: 'app-resident-detail-page',
  imports: [ResidentOverview, ResidentBracelet, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a mat-button routerLink="/admin/residents" class="back">
      <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon> Résidents
    </a>

    @if (resident.isLoading()) {
      <mat-progress-bar mode="indeterminate" />
    } @else if (error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    } @else if (resident.hasValue()) {
      @let r = resident.value();
      <app-resident-overview [resident]="r">
        <div class="resident-actions">
          <button mat-flat-button type="button" [disabled]="deactivating()" (click)="edit(r)">
            <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">edit</mat-icon>
            Modifier le séjour et l’identité
          </button>
          @if (r.active) {
            <button mat-stroked-button type="button" [disabled]="deactivating()" (click)="deactivate(r)">
              Désactiver le résident
            </button>
          }
        </div>
      </app-resident-overview>

      <mat-card appearance="outlined" class="coordination">
        <mat-card-header><mat-card-title>Coordination du séjour</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (!r.active) {
            <p>Suivi de la coordination suspendu pour ce résident inactif.</p>
          } @else if (coordination.error()) {
            <p role="alert">Coordination indisponible.</p>
            <button mat-button type="button" (click)="coordination.reload()">Réessayer</button>
          } @else if (coordination.isLoading()) {
            <p role="status">Chargement de la coordination…</p>
          } @else if (coordination.hasValue()) {
            @let info = coordination.value();
            <dl>
              <div>
                <dt>Service du repas en chambre</dt>
                <dd>{{ info.roomMealService ? 'Prévu' : 'Non prévu' }}</dd>
              </div>
              <div>
                <dt>Aide au repas</dt>
                <dd>{{ info.assistanceCoordination ? 'À coordonner avec les soignants' : 'Aucun besoin signalé' }}</dd>
              </div>
            </dl>
            @if (info.roomMealService || info.assistanceCoordination) {
              <p>Prévenir l’équipe en cas de changement de chambre.</p>
            }
          }
        </mat-card-content>
      </mat-card>

      <div class="grid">
        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Occupants de la chambre {{ r.roomNumber ?? '' }}</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (r.roomId === null) {
              <p>Aucune chambre attribuée.</p>
              @if (r.active) {
                <button mat-button type="button" (click)="edit(r)">Attribuer une chambre</button>
              }
            } @else if (!r.active) {
              <p>Dernière chambre attribuée pendant le séjour.</p>
            } @else if (roommates.error()) {
              <p role="alert">Impossible de charger les occupants.</p>
            } @else if (roommates.isLoading()) {
              <p role="status">Chargement des occupants…</p>
            } @else if (roommates.hasValue()) {
              <p>{{ r.firstName }} {{ r.lastName }} · résident consulté</p>
              @for (mate of roommates.value(); track mate.id) {
                <p><a class="link" [routerLink]="['/admin/residents', mate.id]">{{ mate.firstName }} {{ mate.lastName }}</a></p>
              } @empty {
                <p>Aucun autre occupant actif.</p>
              }
            }
          </mat-card-content>
        </mat-card>
      </div>
      <app-resident-bracelet [residentId]="r.id" [active]="r.active" />
    }
  `,
  styles: `
    .back { margin-bottom: 8px; }
    .resident-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .coordination { margin-top: 16px; }
    .coordination dl { display: flex; flex-wrap: wrap; gap: 12px 32px; }
    .coordination dt { font-weight: 600; }
    .coordination dd { margin: 4px 0 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 16px; margin-top: 16px; }
  `,
})
export class ResidentDetailPage {
  private readonly service = inject(AdminResidentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => {
    const id = Number(params.get('id'));
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
  })), { requireSync: true });
  private editRef?: { id: number; dialog: MatDialogRef<ResidentFormDialog> };

  private readonly deactivatingId = signal<number | null>(null);
  protected readonly deactivating = computed(() => this.deactivatingId() === this.id());

  protected readonly resident = rxResource({
    params: this.id,
    stream: ({ params }) => this.service.get(params),
  });
  protected readonly coordination = rxResource({
    params: () => this.resident.hasValue() && this.resident.value().active ? this.resident.value().id : undefined,
    stream: ({ params }) => this.service.coordination(params),
  });
  protected readonly roommates = rxResource({
    params: () => {
      const resident = this.resident.hasValue() ? this.resident.value() : undefined;
      return resident?.active && resident.roomId != null ? { room: resident.roomId, exclude: resident.id } : undefined;
    },
    stream: ({ params }) => this.service.byRoom(params.room)
      .pipe(map(list => list.filter(resident => resident.id !== params.exclude))),
  });

  protected readonly error = computed(() => {
    if (this.id() === undefined) return 'Identifiant de résident invalide.';
    return this.resident.error() ? apiErrorMessage(this.resident.error(), 'Résident introuvable') : null;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (this.editRef && this.editRef.id !== id) this.editRef.dialog.close();
    });
    this.destroyRef.onDestroy(() => this.editRef?.dialog.close());
  }

  protected deactivate(resident: Resident): void {
    if (resident.id !== this.id() || this.deactivatingId() !== null || this.editRef) return;

    const confirmation = this.dialog.open(ConfirmDialog, {
      autoFocus: 'first-tabbable',
      data: {
        title: 'Désactiver le résident ?',
        message: `${resident.firstName} ${resident.lastName} sera retiré des listes actives. Sa place sera libérée et son bracelet désactivé. Son dossier sera conservé.`,
        confirmLabel: 'Désactiver le résident',
      },
    });
    confirmation.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed || resident.id !== this.id()) return;
      this.deactivatingId.set(resident.id);
      this.service.deactivate(resident.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.deactivatingId.set(null);
          if (resident.id !== this.id()) return;
          this.resident.reload();
          this.snackBar.open('Résident désactivé', 'Fermer', { duration: 3000 });
        },
        error: (error: unknown) => {
          this.deactivatingId.set(null);
          if (resident.id !== this.id()) return;
          this.snackBar.open(apiErrorMessage(error, 'Impossible de désactiver le résident.'), 'Fermer');
        },
      });
    });
  }

  protected edit(resident: Resident): void {
    if (this.editRef || resident.id !== this.id()) return;
    const dialog = this.dialog.open(ResidentFormDialog, { data: resident });
    this.editRef = { id: resident.id, dialog };
    dialog.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(saved => {
      if (this.editRef?.dialog === dialog) this.editRef = undefined;
      if (saved && resident.id === this.id()) {
        this.snackBar.open('Résident modifié', 'Fermer', { duration: 3000 });
        this.resident.reload();
      }
    });
  }
}
