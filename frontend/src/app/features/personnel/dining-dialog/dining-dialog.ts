import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PersonnelService, errorMessage } from '../../../core/services/personnel.service';
import { Dining, DiningSeat, DiningSlot, DiningTable, ServiceStatus } from '../../../shared/models/personnel.model';
import { IdentifyDialog, IdentifyDialogData, IdentifyResult } from '../identify-dialog/identify-dialog';
import { MenuDialog } from '../menu-dialog/menu-dialog';

interface DiningSelection { residentId: number; mealId: number }

@Component({
  selector: 'app-dining-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dining-dialog.html',
  styles: `
    .tools, .arrival { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-block: 8px 16px; }
    article { padding: 12px; border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--app-radius); }
    ul { list-style: none; margin: 8px 0; padding: 0; }
    li { display: grid; gap: 4px; padding: 8px 0; border-top: 1px solid var(--mat-sys-outline-variant); }
    .error { color: var(--app-danger); }
  `,
})
export class DiningDialog {
  private readonly api = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly ref = inject<MatDialogRef<DiningDialog, DiningSelection>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly slot = signal<DiningSlot>(new Date().getHours() < 15 ? 'DEJEUNER' : 'DINER');
  protected readonly dining = signal<Dining | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly activeReader = signal<string | null>(null);
  protected readonly readCode = signal('');
  protected readonly editingChevalet = signal<number | null>(null);
  protected readonly chevaletNumber = signal('');
  protected readonly chevaletPattern = /^[1-9][0-9]{0,3}$/;
  protected readonly labels: Record<ServiceStatus, string> = {
    A_FAIRE: 'À faire', FAIT: 'Servi', ABSENT: 'Absent', REFUSE: 'Refusé', PLUS_TARD: 'Plus tard',
  };

  constructor() {
    this.load();
  }

  protected load(slot = this.slot()): void {
    if (this.busy()) return;
    this.slot.set(slot);
    this.busy.set(true);
    this.error.set(null);
    this.api.dining(slot).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: dining => {
        this.dining.set(dining);
        this.busy.set(false);
      },
      error: error => this.fail(error),
    });
  }

  protected openMenu(): void {
    this.dialog.open(MenuDialog, { width: '900px', maxWidth: '96vw' });
  }

  protected confirmArrival(table: DiningTable): void {
    const readerCode = table.readerCode;
    if (!readerCode) return;
    this.dialog.open<IdentifyDialog, IdentifyDialogData, IdentifyResult>(IdentifyDialog, {
      data: { mode: 'personnel', confirmationLabel: 'Confirmer l’arrivée à cette table' },
      width: '560px',
      maxWidth: '96vw',
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.record(readerCode, { residentId: result.residentId }, false);
    });
  }

  protected toggleReader(code: string): void {
    this.activeReader.set(this.activeReader() === code ? null : code);
    this.readCode.set('');
  }

  protected readTag(readerCode: string): void {
    const token = this.readCode().trim();
    if (token) this.record(readerCode, { token }, false);
  }

  protected leave(table: DiningTable, seat: DiningSeat): void {
    if (table.readerCode) this.record(table.readerCode, { residentId: seat.resident.id }, true);
  }

  protected toggleChevalet(seat: DiningSeat): void {
    this.editingChevalet.set(this.editingChevalet() === seat.resident.id ? null : seat.resident.id);
    this.chevaletNumber.set('');
  }

  protected saveChevalet(seat: DiningSeat): void {
    const number = this.chevaletNumber().trim();
    if (this.busy() || (!seat.chevalet && !this.chevaletPattern.test(number))) return;
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    const request = seat.chevalet
      ? this.api.releaseChevalet(seat.resident.id, seat.chevalet)
      : this.api.assignChevalet(seat.resident.id, number);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.editingChevalet.set(null);
        this.status.set(seat.chevalet ? 'Chevalet libéré.' : 'Chevalet associé.');
        this.load();
      },
      error: error => this.fail(error),
    });
  }

  protected openMeal(seat: DiningSeat): void {
    if (seat.meal) this.ref.close({ residentId: seat.resident.id, mealId: seat.meal.id });
  }

  private record(readerCode: string, identity: { residentId: number } | { token: string }, leaving: boolean): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    this.api.recordTablePresence(readerCode, identity, leaving).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reading => {
        this.busy.set(false);
        this.readCode.set('');
        this.status.set(reading.message);
        this.load();
      },
      error: error => this.fail(error),
    });
  }

  private fail(error: unknown): void {
    this.busy.set(false);
    this.error.set(errorMessage(error));
  }
}
