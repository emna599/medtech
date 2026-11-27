import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { JOB_LABEL, SHIFT_LABEL, Job, Shift } from '../../../shared/models/personnel.model';
import { ROLE_LABEL } from '../../../shared/models/auth.model';
import { ALL_ROLES, AdminUser } from '../../../shared/models/user.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminUserService } from './admin-user.service';

export interface UserFormData {
  /** Absent = création d'un nouveau compte. */
  user?: AdminUser;
  /** Identifiant de l'administrateur connecté (il ne peut pas se désactiver lui-même). */
  currentUsername?: string;
}

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifier le compte' : 'Nouveau compte' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="fields">
        @if (!isEdit) {
          <mat-form-field appearance="outline">
            <mat-label>Identifiant</mat-label>
            <input matInput formControlName="username" autocomplete="off" />
            @if (form.controls.username.hasError('required')) {
              <mat-error>L'identifiant est obligatoire</mat-error>
            } @else if (form.controls.username.invalid) {
              <mat-error>3 caractères minimum, sans espace ni accent</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.invalid) {
              <mat-error>12 à 72 caractères</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Nom complet</mat-label>
          <input matInput formControlName="fullName" />
          @if (form.controls.fullName.invalid) {
            <mat-error>Le nom complet est obligatoire</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rôle</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role) {
              <mat-option [value]="role">{{ roleLabel[role] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (form.controls.role.value === 'PERSONNEL') {
          <mat-form-field appearance="outline">
            <mat-label>Fonction</mat-label>
            <mat-select formControlName="job">
              @if (!data.user?.job) {
                <mat-option value="">Non renseignée</mat-option>
              }
              @for (job of jobs; track job) {
                <mat-option [value]="job">{{ jobLabel[job] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (form.controls.job.value) {
            <mat-form-field appearance="outline">
              <mat-label>Équipe</mat-label>
              <mat-select formControlName="shift">
                @for (shift of shifts; track shift) {
                  <mat-option [value]="shift">{{ shiftLabel[shift] }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        }

        @if (isEdit) {
          <mat-slide-toggle formControlName="enabled">Compte actif</mat-slide-toggle>
        }

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit" [disabled]="saving()">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: min(420px, 80vw);
      padding-top: 8px;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class UserFormDialog {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly service = inject(AdminUserService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, boolean>);
  protected readonly data = inject<UserFormData>(MAT_DIALOG_DATA);

  protected readonly roles = ALL_ROLES;
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly jobs: Job[] = ['INFIRMIER', 'AIDE_SOIGNANT', 'SERVICE', 'CUISINE'];
  protected readonly shifts: Shift[] = ['JOUR', 'NUIT'];
  protected readonly jobLabel = JOB_LABEL;
  protected readonly shiftLabel = SHIFT_LABEL;
  protected readonly isEdit = !!this.data.user;
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    username: [
      this.data.user?.username ?? '',
      this.isEdit ? [] : [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z0-9._-]+$/)],
    ],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    fullName: [this.data.user?.fullName ?? '', [Validators.required, Validators.maxLength(150)]],
    role: [this.data.user?.role ?? ('PERSONNEL' as AdminUser['role']), Validators.required],
    enabled: [this.data.user?.enabled ?? true],
    job: this.fb.control<Job | ''>(this.data.user?.job ?? ''),
    shift: this.fb.control<Shift>(this.data.user?.shift ?? 'JOUR'),
  });

  constructor() {
    // Un administrateur ne peut pas modifier son propre rôle ni son état (le serveur le refuse aussi).
    if (this.isEdit && this.data.user?.username === this.data.currentUsername) {
      this.form.controls.role.disable();
      this.form.controls.enabled.disable();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const staffProfile = value.role === 'PERSONNEL' && value.job
      ? { job: value.job, shift: value.shift }
      : {};

    const request$ = this.data.user
      ? this.service.update(this.data.user.id, {
          fullName: value.fullName,
          role: value.role,
          ...staffProfile,
          enabled: value.enabled,
        })
      : this.service.create({
          username: value.username,
          password: value.password,
          fullName: value.fullName,
          role: value.role,
          ...staffProfile,
        });

    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, "Impossible d'enregistrer le compte"));
      },
    });
  }
}
