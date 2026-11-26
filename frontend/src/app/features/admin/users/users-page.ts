import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_LABEL, Role } from '../../../shared/models/auth.model';
import { ALL_ROLES, AdminUser } from '../../../shared/models/user.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { normalize } from '../../../shared/utils/text';
import { AdminUserService } from './admin-user.service';
import { PasswordDialog } from './password-dialog';
import { UserFormDialog } from './user-form-dialog';

@Component({
  selector: 'app-users-page',
  imports: [
    DatePipe,
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
        <h1>Comptes utilisateurs</h1>
        <p>{{ filtered().length }} compte(s) affiché(s) sur {{ users().length }}</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm()">
        <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon> Nouveau compte
      </button>
    </header>

    <section class="work-list">
      <div class="filters">
        <mat-form-field appearance="outline" class="grow" subscriptSizing="dynamic">
          <mat-label>Rechercher</mat-label>
          <input matInput placeholder="Nom ou identifiant" [value]="search()" (input)="onSearch($event)" />
          <mat-icon matSuffix fontSet="material-symbols-outlined">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="select" subscriptSizing="dynamic">
          <mat-label>Rôle</mat-label>
          <mat-select [value]="roleFilter()" (valueChange)="roleFilter.set($event)">
            <mat-option value="">Tous</mat-option>
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
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
        <div mat-sort-header="fullName">Nom</div>
        <div mat-sort-header="username">Identifiant</div>
        <div mat-sort-header="role">Rôle</div>
        <div mat-sort-header="enabled">État</div>
        <div mat-sort-header="createdAt">Création</div>
      </div>

      <div class="work-card-grid">
        @for (u of displayed(); track u.id) {
          <mat-card appearance="outlined" class="work-card">
            <mat-card-content class="work-card-content">
              <div class="work-card-heading">
                <h2>{{ u.fullName }}</h2>
                <span class="work-status" [class.inactive]="!u.enabled"><mat-icon fontSet="material-symbols-outlined" aria-hidden="true">{{ u.enabled ? 'check_circle' : 'person_off' }}</mat-icon> {{ u.enabled ? 'Actif' : 'Désactivé' }}</span>
              </div>
              <p><strong>Identifiant</strong> · {{ u.username }}</p>
              <p><strong>Rôle</strong> · {{ labelOf(u) }}</p>
              <p><strong>Créé le</strong> · {{ u.createdAt | date:'dd/MM/yyyy' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button type="button" (click)="openForm(u)">Modifier</button>
              <button mat-icon-button type="button" [attr.aria-label]="'Changer le mot de passe de ' + u.fullName" (click)="openPassword(u)">
                <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">key</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
      @if (!loading() && filtered().length === 0) {
        <p class="empty">Aucun compte ne correspond.</p>
      }
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons />
    </section>
  `,
})
export class UsersPage {
  private readonly service = inject(AdminUserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  protected readonly roles = ALL_ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }));
  protected readonly dataSource = new MatTableDataSource<AdminUser>([]);
  protected readonly displayed = toSignal(this.dataSource.connect(), { initialValue: [] });
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly search = signal('');
  protected readonly roleFilter = signal<Role | ''>('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly filtered = computed(() => {
    const text = normalize(this.search());
    const role = this.roleFilter();
    return this.users().filter(
      (u) =>
        (!role || u.role === role) &&
        (!text || normalize(u.fullName).includes(text) || normalize(u.username).includes(text)),
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

  protected labelOf(user: AdminUser): string {
    return ROLE_LABEL[user.role];
  }

  protected openForm(user?: AdminUser): void {
    this.dialog
      .open(UserFormDialog, {
        data: { user, currentUsername: this.auth.currentUser()?.username },
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(user ? 'Compte modifié' : 'Compte créé', 'OK', { duration: 3000 });
          this.load();
        }
      });
  }

  protected openPassword(user: AdminUser): void {
    this.dialog
      .open(PasswordDialog, { data: user })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open('Mot de passe modifié', 'OK', { duration: 3000 });
        }
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Impossible de charger les comptes'));
        this.loading.set(false);
      },
    });
  }
}
