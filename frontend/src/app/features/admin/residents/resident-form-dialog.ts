import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Resident } from '../../../shared/models/resident.model';
import { Room } from '../../../shared/models/room.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminRoomService } from '../rooms/admin-room.service';
import { AdminResidentService } from './admin-resident.service';

@Component({
  selector: 'app-resident-form-dialog',
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
    <h2 mat-dialog-title>{{ resident ? 'Modifier le résident' : 'Nouveau résident' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="fields">
        <mat-form-field appearance="outline">
          <mat-label>Nom</mat-label>
          <input matInput formControlName="lastName" />
          @if (form.controls.lastName.invalid) {
            <mat-error>Le nom est obligatoire</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Prénom</mat-label>
          <input matInput formControlName="firstName" />
          @if (form.controls.firstName.invalid) {
            <mat-error>Le prénom est obligatoire</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date de naissance</mat-label>
          <input matInput type="date" formControlName="birthDate" />
          @if (form.controls.birthDate.invalid) {
            <mat-error>La date de naissance est obligatoire</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date d'admission</mat-label>
          <input matInput type="date" formControlName="admissionDate" />
          @if (form.controls.admissionDate.invalid) {
            <mat-error>La date d'admission est obligatoire</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Chambre</mat-label>
          <mat-select formControlName="roomId">
            <mat-option [value]="null">Aucune chambre</mat-option>
            @for (room of rooms(); track room.id) {
              <mat-option [value]="room.id" [disabled]="isFull(room)">
                {{ room.number }} · étage {{ room.floor }} · {{ room.occupied }}/{{ room.capacity }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (resident) {
          <mat-slide-toggle formControlName="active">Résident actif</mat-slide-toggle>
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
      min-width: min(420px, 80vw);
      padding-top: 8px;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class ResidentFormDialog {
  private readonly residentService = inject(AdminResidentService);
  private readonly roomService = inject(AdminRoomService);
  private readonly dialogRef = inject(MatDialogRef<ResidentFormDialog, boolean>);
  protected readonly resident = inject<Resident | undefined>(MAT_DIALOG_DATA);

  protected readonly rooms = signal<Room[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    lastName: [this.resident?.lastName ?? '', [Validators.required, Validators.maxLength(100)]],
    firstName: [this.resident?.firstName ?? '', [Validators.required, Validators.maxLength(100)]],
    birthDate: [this.resident?.birthDate ?? '', Validators.required],
    admissionDate: [this.resident?.admissionDate ?? new Date().toISOString().slice(0, 10), Validators.required],
    roomId: [this.resident?.roomId ?? (null as number | null)],
    active: [this.resident?.active ?? true],
  });

  constructor() {
    this.roomService.list().subscribe((rooms) => this.rooms.set(rooms));
  }

  /** Une chambre complète n'est pas proposée, sauf si le résident l'occupe déjà. */
  protected isFull(room: Room): boolean {
    const alreadyThere = this.resident?.active && this.resident.roomId === room.id;
    return room.occupied >= room.capacity && !alreadyThere;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const payload = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      birthDate: value.birthDate,
      admissionDate: value.admissionDate,
      roomId: value.roomId,
      active: value.active,
    };
    const request$ = this.resident
      ? this.residentService.update(this.resident.id, payload)
      : this.residentService.create(payload);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, "Impossible d'enregistrer le résident"));
      },
    });
  }
}
