import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable, switchMap, throwError } from 'rxjs';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import {
  CompleteRequest,
  doneLabel,
  fullName,
  QUANTITIES,
  QUANTITY_LABEL,
  QuantityEaten,
  REFUSAL_REASONS,
  ServiceItem,
  slotLabel,
} from '../../../shared/models/personnel.model';
import { ResidentAvatar } from '../components/resident-avatar';

export interface ResidentSheetData {
  item: ServiceItem;
}

/** `changed` : quelque chose a été modifié (recharger la liste). `completed` : l'action est faite (passer au suivant). */
export interface ResidentSheetResult {
  changed: boolean;
  completed: boolean;
}

/** Fiche du résident : photo, alertes, régime, et les boutons « Servi / Donné », « Refusé », « Plus tard ». */
@Component({
  selector: 'app-resident-sheet',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ResidentAvatar,
  ],
  templateUrl: './resident-sheet.html',
  styleUrl: './resident-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentSheet {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<ResidentSheet, ResidentSheetResult>>(MatDialogRef);
  private readonly data = inject<ResidentSheetData>(MAT_DIALOG_DATA);

  private changed = false;

  protected readonly item = signal<ServiceItem>(this.data.item);
  protected readonly resident = computed(() => this.item().resident);
  protected readonly name = computed(() => fullName(this.resident()));

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly refusing = signal(false);
  protected readonly refusalReason = signal<string | null>(null);
  protected readonly showDoubt = signal(false);
  protected readonly doubtNote = signal('');

  protected readonly quantities = QUANTITIES;
  protected readonly quantityLabel = QUANTITY_LABEL;

  protected readonly doneText = computed(() => doneLabel(this.item().kind));
  protected readonly slotText = computed(() => slotLabel(this.item().slot));
  protected readonly refusalReasons = computed(() => REFUSAL_REASONS[this.item().kind]);

  protected readonly pending = computed(
    () => this.item().status === 'A_FAIRE' || this.item().status === 'PLUS_TARD',
  );
  protected readonly hasDoubt = computed(() => this.resident().identityDoubt);
  protected readonly roomText = computed(() => {
    const r = this.resident();
    return r.room ? `Chambre ${r.room}${r.floor !== null ? ` · étage ${r.floor}` : ''}` : 'Sans chambre';
  });
  protected readonly otherLocationLabel = computed(() =>
    this.resident().mealLocation === 'SALLE' ? 'Passer en chambre' : 'Passer en salle à manger',
  );

  protected statusText(): string {
    switch (this.item().status) {
      case 'FAIT':
        return this.doneText();
      case 'REFUSE':
        return 'Refusé';
      case 'PLUS_TARD':
        return 'Reporté';
      default:
        return 'À faire';
    }
  }

  // ------------------------------------------------------------------ actions

  protected done(): void {
    this.complete({ status: 'FAIT' });
  }

  protected later(): void {
    this.complete({ status: 'PLUS_TARD' });
  }

  protected confirmRefusal(): void {
    const reason = this.refusalReason();
    if (reason) {
      this.complete({ status: 'REFUSE', comment: reason });
    }
  }

  protected toggleRefusal(): void {
    this.refusing.update((value) => !value);
    this.refusalReason.set(null);
  }

  protected setQuantity(quantity: QuantityEaten): void {
    this.run(this.api.setQuantity(this.item().id, quantity), (updated) => {
      this.item.set(updated);
      this.changed = true;
    });
  }

  protected toggleLocation(): void {
    const next = this.resident().mealLocation === 'SALLE' ? 'CHAMBRE' : 'SALLE';
    this.run(this.api.changeMealLocation(this.resident().id, next), (resident) => {
      this.item.update((current) => ({ ...current, resident }));
      this.changed = true;
    });
  }

  protected reportDoubt(): void {
    this.run(this.api.reportDoubt(this.resident().id, this.doubtNote().trim()), () => {
      this.item.update((current) => ({ ...current, resident: { ...current.resident, identityDoubt: true } }));
      this.showDoubt.set(false);
      this.doubtNote.set('');
      this.changed = true;
    });
  }

  /** Confirmation par un AUTRE soignant (le backend refuse si c'est la même personne). */
  protected resolveDoubt(): void {
    const residentId = this.resident().id;
    const request$ = this.api.openDoubts().pipe(
      switchMap((doubts) => {
        const doubt = doubts.find((d) => d.residentId === residentId);
        return doubt ? this.api.resolveDoubt(doubt.id) : throwError(() => new Error('Aucun doute en cours'));
      }),
    );
    this.run(request$, () => {
      this.item.update((current) => ({ ...current, resident: { ...current.resident, identityDoubt: false } }));
      this.changed = true;
    });
  }

  protected close(): void {
    this.ref.close({ changed: this.changed, completed: false });
  }

  // ------------------------------------------------------------------ interne

  private complete(body: CompleteRequest): void {
    this.run(this.api.complete(this.item(), body), (updated) => {
      this.item.set(updated);
      // « Un geste » : on referme tout de suite et la liste passe au suivant.
      this.ref.close({ changed: true, completed: true });
    });
  }

  private run<T>(request$: Observable<T>, onSuccess: (value: T) => void): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    request$.subscribe({
      next: (value) => {
        this.busy.set(false);
        onSuccess(value);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      },
    });
  }
}
