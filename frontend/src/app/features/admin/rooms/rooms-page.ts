import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AdminResidentService } from '../residents/admin-resident.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Room } from '../../../shared/models/room.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { normalize } from '../../../shared/utils/text';
import { AdminRoomService } from './admin-room.service';
import { RoomFormDialog } from './room-form-dialog';

type Availability = 'all' | 'free' | 'full';

@Component({
  selector: 'app-rooms-page',
  imports: [
    MatCardModule,
    RouterLink,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Chambres et étages</h1>
        <p>{{ filtered().length }} chambre(s) affichée(s) sur {{ rooms().length }}</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm()">
        <mat-icon fontSet="material-symbols-outlined">add</mat-icon> Nouvelle chambre
      </button>
    </header>

    <section class="work-list">
      <div class="filters">
        <mat-form-field appearance="outline" class="grow" subscriptSizing="dynamic">
          <mat-label>Rechercher une chambre</mat-label>
          <input matInput placeholder="Numéro" [value]="search()" (input)="onSearch($event)" />
          <mat-icon matSuffix fontSet="material-symbols-outlined">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="select" subscriptSizing="dynamic">
          <mat-label>Étage</mat-label>
          <mat-select [value]="floorFilter()" (valueChange)="floorFilter.set($event)">
            <mat-option [value]="null">Tous</mat-option>
            @for (floor of floors(); track floor) {
              <mat-option [value]="floor">Étage {{ floor }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="select" subscriptSizing="dynamic">
          <mat-label>Disponibilité</mat-label>
          <mat-select [value]="availability()" (valueChange)="availability.set($event)">
            <mat-option value="all">Toutes</mat-option>
            <mat-option value="free">Avec lit libre</mat-option>
            <mat-option value="full">Complètes</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="work-sort" matSort role="group" aria-label="Trier les résultats">
        <span>Trier par</span>
        <div mat-sort-header="floor">Étage</div>
        <div mat-sort-header="number">Numéro</div>
        <div mat-sort-header="capacity">Capacité</div>
        <div mat-sort-header="occupied">Occupation</div>
      </div>

      <div class="work-card-grid">
        @for (r of displayed(); track r.id) {
          <mat-card appearance="outlined" class="work-card">
            <mat-card-content class="work-card-content">
              <div class="work-card-heading">
                <h2>Chambre {{ r.number }}</h2>
                <span class="work-status" [class.inactive]="r.occupied >= r.capacity">
                  <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">bed</mat-icon> {{ r.occupied >= r.capacity ? 'Complète' : 'Disponible' }}
                </span>
              </div>
              <p><strong>Étage</strong> · {{ r.floor }}</p>
              <p><strong>Lits occupés</strong> · {{ r.occupied }} / {{ r.capacity }}</p>
              <button mat-button type="button" [attr.aria-expanded]="selectedRoomId() === r.id"
                (click)="selectedRoomId.set(selectedRoomId() === r.id ? undefined : r.id)">
                {{ selectedRoomId() === r.id ? 'Masquer les occupants' : 'Voir les occupants' }}
              </button>
              @if (selectedRoomId() === r.id) {
                @if (occupants.isLoading()) {
                  <p role="status">Chargement des occupants…</p>
                } @else if (occupants.error()) {
                  <p role="alert">Impossible de charger les occupants.</p>
                  <button mat-button type="button" (click)="occupants.reload()">Réessayer</button>
                } @else if (occupants.hasValue()) {
                  @if (occupants.value().length) {
                    <ul aria-label="Occupants actifs">
                      @for (resident of occupants.value(); track resident.id) {
                        <li><a [routerLink]="['/admin/residents', resident.id]">{{ resident.firstName }} {{ resident.lastName }}</a></li>
                      }
                    </ul>
                  } @else {
                    <p>Aucun occupant actif.</p>
                  }
                }
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button type="button" [attr.aria-label]="'Modifier la chambre ' + r.number" (click)="openForm(r)">Modifier</button>
              <button mat-icon-button type="button" [attr.aria-label]="'Supprimer la chambre ' + r.number" (click)="remove(r)">
                <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">delete</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
      @if (!loading() && filtered().length === 0) {
        <p class="empty">Aucune chambre ne correspond.</p>
      }
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons />
    </section>
  `,
})
export class RoomsPage {
  private readonly service = inject(AdminRoomService);
  private readonly residents = inject(AdminResidentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dataSource = new MatTableDataSource<Room>([]);
  protected readonly displayed = toSignal(this.dataSource.connect(), { initialValue: [] });
  protected readonly rooms = signal<Room[]>([]);
  protected readonly search = signal('');
  protected readonly floorFilter = signal<number | null>(null);
  protected readonly availability = signal<Availability>('all');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly selectedRoomId = signal<number | undefined>(undefined);
  protected readonly occupants = rxResource({
    params: this.selectedRoomId,
    stream: ({ params }) => this.residents.byRoom(params),
  });

  protected readonly floors = computed(() =>
    [...new Set(this.rooms().map((r) => r.floor))].sort((a, b) => a - b),
  );
  protected readonly filtered = computed(() => {
    const text = normalize(this.search());
    const floor = this.floorFilter();
    const availability = this.availability();
    return this.rooms().filter(
      (r) =>
        (!text || normalize(r.number).includes(text)) &&
        (floor === null || r.floor === floor) &&
        (availability === 'all' ||
          (availability === 'free' ? r.occupied < r.capacity : r.occupied >= r.capacity)),
    );
  });

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dataSource.disconnect());
    effect(() => {
      this.dataSource.data = this.filtered();
    });
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
    this.load();
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected openForm(room?: Room): void {
    this.dialog
      .open(RoomFormDialog, { data: room })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(room ? 'Chambre modifiée' : 'Chambre créée', 'OK', { duration: 3000 });
          this.load();
        }
      });
  }

  protected remove(room: Room): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Supprimer la chambre ?',
          message: `La chambre ${room.number} sera supprimée définitivement.`,
          confirmLabel: 'Supprimer',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.service.delete(room.id).subscribe({
          next: () => {
            if (this.selectedRoomId() === room.id) this.selectedRoomId.set(undefined);
            this.snackBar.open('Chambre supprimée', 'OK', { duration: 3000 });
            this.load();
          },
          error: (err) => this.snackBar.open(apiErrorMessage(err, 'Suppression impossible'), 'OK', { duration: 5000 }),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Impossible de charger les chambres'));
        this.loading.set(false);
      },
    });
  }
}
