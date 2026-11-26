import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { Router } from '@angular/router';
import { EMPTY, catchError, combineLatest, debounceTime, startWith, Subject, switchMap, tap } from 'rxjs';
import { Resident, ageFrom } from '../../../shared/models/resident.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminResidentService } from './admin-resident.service';
import { ResidentFormDialog } from './resident-form-dialog';

@Component({
  selector: 'app-residents-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
        <h1>Résidents</h1>
        <p>{{ dataSource.data.length }} résultat(s) · cliquez sur une ligne pour ouvrir la fiche</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm()">
        <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon> Nouveau résident
      </button>
    </header>

    <section class="panel">
      <div class="filters">
        <mat-form-field appearance="outline" class="grow" subscriptSizing="dynamic">
          <mat-label>Rechercher un résident</mat-label>
          <input matInput [formControl]="search" placeholder="Nom ou prénom" />
          <mat-icon matSuffix fontSet="material-symbols-outlined">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="select" subscriptSizing="dynamic">
          <mat-label>État</mat-label>
          <mat-select [formControl]="state">
            <mat-option value="all">Tous</mat-option>
            <mat-option value="active">Actifs</mat-option>
            <mat-option value="inactive">Inactifs</mat-option>
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
          <ng-container matColumnDef="name">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Résident</th>
            <td mat-cell *matCellDef="let r">{{ r.lastName }} {{ r.firstName }}</td>
          </ng-container>
          <ng-container matColumnDef="age">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Âge</th>
            <td mat-cell *matCellDef="let r">{{ age(r) }} ans</td>
          </ng-container>
          <ng-container matColumnDef="room">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Chambre</th>
            <td mat-cell *matCellDef="let r">
              @if (noRoom(r)) {
                <span class="badge off">Sans chambre</span>
              } @else {
                {{ roomLabel(r) }}
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="admission">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Admission</th>
            <td mat-cell *matCellDef="let r">{{ r.admissionDate | date: 'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>État</th>
            <td mat-cell *matCellDef="let r">
              <span class="badge" [class.off]="!r.active">{{ r.active ? 'Actif' : 'Inactif' }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r" class="row-actions">
              <button
                mat-icon-button
                type="button"
                aria-label="Modifier"
                title="Modifier"
                (click)="$event.stopPropagation(); openForm(r)"
              >
                <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row class="clickable" [class.no-room]="noRoom(row)" *matRowDef="let row; columns: columns" (click)="open(row)"></tr>
        </table>
      </div>
      @if (!loading() && dataSource.data.length === 0) {
        <p class="empty">Aucun résident ne correspond à la recherche.</p>
      }
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons />
    </section>
  `,
})
export class ResidentsPage {
  private readonly service = inject(AdminResidentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  protected readonly columns = ['name', 'age', 'room', 'admission', 'active', 'actions'];
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly state = new FormControl<'all' | 'active' | 'inactive'>('active', { nonNullable: true });
  protected readonly dataSource = new MatTableDataSource<Resident>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    this.dataSource.sortingDataAccessor = (r, column) => {
      switch (column) {
        case 'name':
          return `${r.lastName} ${r.firstName}`.toLowerCase();
        case 'age':
          return -new Date(r.birthDate).getTime();
        case 'room':
          return r.roomNumber ?? '';
        case 'admission':
          return r.admissionDate;
        case 'active':
          return r.active ? 1 : 0;
        default:
          return '';
      }
    };
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });

    combineLatest([
      this.search.valueChanges.pipe(startWith(''), debounceTime(300)),
      this.state.valueChanges.pipe(startWith(this.state.value)),
      this.reload$.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(([text, state]) =>
          this.service.list(text, state === 'all' ? null : state === 'active').pipe(
            catchError((err) => {
              this.error.set(apiErrorMessage(err, 'Impossible de charger les résidents'));
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((residents) => {
        this.dataSource.data = residents;
        this.loading.set(false);
      });
  }

  protected age(resident: Resident): number {
    return ageFrom(resident.birthDate);
  }

  /** Résident actif sans chambre : à mettre en évidence. */
  protected noRoom(resident: Resident): boolean {
    return resident.active && resident.roomId === null;
  }

  protected roomLabel(resident: Resident): string {
    return resident.roomNumber ? `${resident.roomNumber} (étage ${resident.floor})` : 'Aucune';
  }

  protected open(resident: Resident): void {
    void this.router.navigate(['/admin/residents', resident.id]);
  }

  protected openForm(resident?: Resident): void {
    this.dialog
      .open(ResidentFormDialog, { data: resident })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(resident ? 'Résident modifié' : 'Résident ajouté', 'OK', { duration: 3000 });
          this.reload$.next();
        }
      });
  }
}
