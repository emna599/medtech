import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminUser } from '../../../shared/models/user.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminUserService } from './admin-user.service';

@Component({
  selector: 'app-password-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Nouveau mot de passe</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="fields">
        <p>Compte : <strong>{{ user.fullName }}</strong> ({{ user.username }})</p>
        <mat-form-field appearance="outline">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.invalid) {
            <mat-error>8 caractères minimum</mat-error>
          }
        </mat-form-field>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Changer</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      min-width: min(420px, 80vw);
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class PasswordDialog {
  private readonly service = inject(AdminUserService);
  private readonly dialogRef = inject(MatDialogRef<PasswordDialog, boolean>);
  protected readonly user = inject<AdminUser>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.service.resetPassword(this.user.id, this.form.getRawValue().password).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible de changer le mot de passe'));
      },
    });
  }
}
