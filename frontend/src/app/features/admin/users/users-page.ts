import { DatePipe } from '@angular/common';
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
        <h1>Comptes utilisateurs</h1>
        <p>{{ filtered().length }} compte(s) affiché(s) sur {{ users().length }}</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm()">
        <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon> Nouveau compte
      </button>
    </header>

    <section class="panel">
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

      <div class="table-wrap">
        <table mat-table matSort [dataSource]="dataSource">
          <ng-container matColumnDef="fullName">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let u">{{ u.fullName }}</td>
          </ng-container>
          <ng-container matColumnDef="username">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Identifiant</th>
            <td mat-cell *matCellDef="let u">{{ u.username }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let u">{{ labelOf(u) }}</td>
          </ng-container>
          <ng-container matColumnDef="enabled">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>État</th>
            <td mat-cell *matCellDef="let u">
              <span class="badge" [class.off]="!u.enabled">{{ u.enabled ? 'Actif' : 'Désactivé' }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>Créé le</th>
            <td mat-cell *matCellDef="let u">{{ u.createdAt | date: 'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u" class="row-actions">
              <button mat-icon-button type="button" aria-label="Modifier" title="Modifier" (click)="openForm(u)">
                <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
              </button>
              <button mat-icon-button type="button" aria-label="Changer le mot de passe" title="Changer le mot de passe" (click)="openPassword(u)">
                <mat-icon fontSet="material-symbols-outlined">key</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
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

  protected readonly columns = ['fullName', 'username', 'role', 'enabled', 'createdAt', 'actions'];
  protected readonly roles = ALL_ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }));
  protected readonly dataSource = new MatTableDataSource<AdminUser>([]);
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
