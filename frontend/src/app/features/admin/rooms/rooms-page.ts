import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
    MatTableModule,
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

    <section class="panel">
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

      <div class="table-wrap">
        <table mat-table matSort [dataSource]="dataSource">
          <ng-container matColumnDef="floor">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Étage</th>
            <td mat-cell *matCellDef="let r">{{ r.floor }}</td>
          </ng-container>
          <ng-container matColumnDef="number">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Chambre</th>
            <td mat-cell *matCellDef="let r">{{ r.number }}</td>
          </ng-container>
          <ng-container matColumnDef="capacity">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Lits</th>
            <td mat-cell *matCellDef="let r">{{ r.capacity }}</td>
          </ng-container>
          <ng-container matColumnDef="occupied">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Occupation</th>
            <td mat-cell *matCellDef="let r">
              <span class="badge" [class.warn]="r.occupied >= r.capacity">{{ r.occupied }} / {{ r.capacity }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r" class="row-actions">
              <button mat-icon-button type="button" aria-label="Modifier" title="Modifier" (click)="openForm(r)">
                <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
              </button>
              <button mat-icon-button type="button" aria-label="Supprimer" title="Supprimer" (click)="remove(r)">
                <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columns = ['floor', 'number', 'capacity', 'occupied', 'actions'];
  protected readonly dataSource = new MatTableDataSource<Room>([]);
  protected readonly rooms = signal<Room[]>([]);
  protected readonly search = signal('');
  protected readonly floorFilter = signal<number | null>(null);
  protected readonly availability = signal<Availability>('all');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

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
