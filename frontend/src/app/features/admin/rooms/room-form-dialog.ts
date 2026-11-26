import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Room } from '../../../shared/models/room.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminRoomService } from './admin-room.service';

@Component({
  selector: 'app-room-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ room ? 'Modifier la chambre' : 'Nouvelle chambre' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>Numéro</mat-label>
          <input matInput formControlName="number" autocomplete="off" />
          <mat-hint>Étage suivi de 2 chiffres : étage 2 → 201 à 299</mat-hint>
          @if (form.controls.number.hasError('required')) {
            <mat-error>Le numéro est obligatoire</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Étage</mat-label>
          <input matInput type="number" formControlName="floor" />
          @if (form.controls.floor.invalid) {
            <mat-error>Étage entre 0 et 20</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Capacité (nombre de lits)</mat-label>
          <input matInput type="number" formControlName="capacity" />
          @if (form.controls.capacity.invalid) {
            <mat-error>Capacité entre 1 et 20</mat-error>
          }
        </mat-form-field>
        @if (form.hasError('numberFormat') && form.controls.number.touched) {
          <p class="error" role="alert">Le numéro doit commencer par l'étage suivi de 2 chiffres (ex. étage 2 : 201).</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields {
      display: flex;
      flex-direction: column;
      min-width: min(380px, 80vw);
      padding-top: 8px;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class RoomFormDialog {
  private readonly service = inject(AdminRoomService);
  private readonly dialogRef = inject(MatDialogRef<RoomFormDialog, boolean>);
  protected readonly room = inject<Room | undefined>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      number: [this.room?.number ?? '', [Validators.required, Validators.maxLength(20)]],
      floor: [this.room?.floor ?? 1, [Validators.required, Validators.min(0), Validators.max(20)]],
      capacity: [this.room?.capacity ?? 1, [Validators.required, Validators.min(1), Validators.max(20)]],
    },
    { validators: [RoomFormDialog.numberMatchesFloor] },
  );

  /** Numéro = étage + 2 chiffres (01 à 99). */
  private static numberMatchesFloor(group: AbstractControl): ValidationErrors | null {
    const number = String(group.get('number')?.value ?? '').trim();
    const floor = group.get('floor')?.value;
    if (!number || floor === null || floor === '') {
      return null;
    }
    return new RegExp(`^${Number(floor)}(0[1-9]|[1-9][0-9])$`).test(number) ? null : { numberFormat: true };
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const payload = { number: value.number.trim(), floor: Number(value.floor), capacity: Number(value.capacity) };
    const request$ = this.room ? this.service.update(this.room.id, payload) : this.service.create(payload);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, "Impossible d'enregistrer la chambre"));
      },
    });
  }
}
