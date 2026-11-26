import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ResidentOverview } from '../../../shared/components/resident-overview/resident-overview';
import { Resident } from '../../../shared/models/resident.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminResidentService } from './admin-resident.service';
import { ResidentFormDialog } from './resident-form-dialog';

@Component({
  selector: 'app-resident-detail-page',
  imports: [ResidentOverview, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
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
        <button mat-flat-button type="button" (click)="edit(r)">
          <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">edit</mat-icon>
          Modifier le séjour et l’identité
        </button>
      </app-resident-overview>

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

        @if (r.active) {
          <mat-card appearance="outlined">
            <mat-card-header><mat-card-title>Coordination du séjour</mat-card-title></mat-card-header>
            <mat-card-content>
              @if (coordination.error()) {
                <p role="alert">Coordination indisponible.</p>
              } @else if (coordination.isLoading()) {
                <p role="status">Chargement de la coordination…</p>
              } @else if (coordination.hasValue()) {
                @let info = coordination.value();
                @if (info.roomMealService) { <p>Un service en chambre est prévu.</p> }
                @if (info.assistanceCoordination) { <p>Coordonner l’aide au repas avec l’équipe de soins.</p> }
                @if (info.roomMealService || info.assistanceCoordination) {
                  <p>Prévenir l’équipe si le résident change de chambre.</p>
                } @else {
                  <p>Aucun besoin de coordination signalé pour le service des repas.</p>
                }
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: `
    .back { margin-bottom: 8px; }
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
