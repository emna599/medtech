import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
    MatCardModule,
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
        <p>{{ dataSource.data.length }} résultat(s)</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm()">
        <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon> Nouveau résident
      </button>
    </header>

    <section class="work-list">
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

      <div class="work-sort" matSort role="group" aria-label="Trier les résultats">
        <span>Trier par</span>
        <div mat-sort-header="name">Nom</div>
        <div mat-sort-header="age">Âge</div>
        <div mat-sort-header="room">Chambre</div>
        <div mat-sort-header="admission">Admission</div>
        <div mat-sort-header="active">État</div>
      </div>

      <div class="work-card-grid">
        @for (r of displayed(); track r.id) {
          <mat-card appearance="outlined" class="work-card">
            <mat-card-content class="work-card-content">
              <div class="work-card-heading">
                <h2>{{ r.firstName }} {{ r.lastName }}</h2>
                <span class="work-status" [class.inactive]="!r.active"><mat-icon fontSet="material-symbols-outlined" aria-hidden="true">{{ r.active ? 'check_circle' : 'person_off' }}</mat-icon> {{ r.active ? 'Actif' : 'Inactif' }}</span>
              </div>
              <div class="work-card-room" [class.work-status]="noRoom(r)" [class.work-alert]="noRoom(r)">
                <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">{{ noRoom(r) ? 'warning' : 'bed' }}</mat-icon>
                @if (r.roomNumber) { Chambre {{ roomLabel(r) }} } @else { Sans chambre }
              </div>
              <p><strong>Âge</strong> · {{ age(r) }} ans</p>
              <p><strong>Admission</strong> · {{ r.admissionDate | date:'dd/MM/yyyy' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button type="button" [attr.aria-label]="'Modifier ' + r.firstName + ' ' + r.lastName" (click)="openForm(r)">Modifier</button>
              <button mat-button type="button" (click)="open(r)">Consulter la fiche</button>
            </mat-card-actions>
          </mat-card>
        }
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

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly state = new FormControl<'all' | 'active' | 'inactive'>('active', { nonNullable: true });
  protected readonly dataSource = new MatTableDataSource<Resident>([]);
  protected readonly displayed = toSignal(this.dataSource.connect(), { initialValue: [] });
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dataSource.disconnect());
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
