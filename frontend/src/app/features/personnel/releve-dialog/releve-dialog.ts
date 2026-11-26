import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, timeout, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createRequestId } from '../../../shared/utils/request-id';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { Doubt, HandoverAction, HandoverAssignment, HandoverBoard, HandoverRequest, ResidentCard, fullName, ServiceItem, slotLabel } from '../../../shared/models/personnel.model';

interface SlotLine {
  slot: string;
  done: number;
  total: number;
}

/** Une personne à signaler à l'équipe suivante, avec la raison en une phrase. */
interface Alert {
  residentName: string;
  room: string | null;
  text: string;
}

@Component({
  selector: 'app-releve-dialog',
  imports: [
    DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule,
  ],
  templateUrl: './releve-dialog.html',
  styleUrl: './releve-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleveDialog {
  private readonly dialog = inject(MatDialog);
  protected readonly currentUser = inject(AuthService).currentUser;
  private readonly api = inject(PersonnelService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly ref = inject<MatDialogRef<ReleveDialog>>(MatDialogRef);

  private readonly formBuilder = inject(FormBuilder);
  private draftId: string | null = null;
  private boardRevision = 0;
  protected readonly board = signal<HandoverBoard | null>(null);
  protected readonly boardLoading = signal(false);
  protected readonly boardError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly closing = signal<number | null>(null);
  protected readonly residents = signal<ResidentCard[]>([]);
  protected readonly residentError = signal(false);
  protected readonly form = this.formBuilder.group({
    residentId: this.formBuilder.control<number | null>(null),
    observation: this.formBuilder.nonNullable.control('', [
      Validators.required, Validators.maxLength(1200), Validators.pattern(/\S/),
    ]),
    expectedAction: this.formBuilder.nonNullable.control('', [
      Validators.required, Validators.maxLength(400), Validators.pattern(/\S/),
    ]),
  });

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly meals = signal<ServiceItem[]>([]);
  private readonly doses = signal<ServiceItem[]>([]);
  protected readonly doubts = signal<Doubt[]>([]);
  protected readonly now = new Date();
  protected readonly nowText = `${this.now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${this.now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  protected readonly mealLines = computed(() => this.lines(this.meals()));
  protected readonly doseLines = computed(() => this.lines(this.doses()));

  /** À surveiller : refus, repas à peine touchés, prises à risque pas encore données. */
  protected readonly alerts = computed<Alert[]>(() => {
    const out: Alert[] = [];
    const add = (item: ServiceItem, text: string) =>
      out.push({ residentName: fullName(item.resident), room: item.resident.room, text });
    for (const item of this.meals()) {
      if (item.status === 'REFUSE') {
        add(item, `a refusé le repas (${slotLabel(item.slot)})`);
      } else if (item.status === 'ABSENT') {
        add(item, `était absent au repas (${slotLabel(item.slot)})`);
      } else if (item.status === 'FAIT' && (item.quantityEaten === 'RIEN' || item.quantityEaten === 'QUART')) {
        add(item, `a très peu mangé (${slotLabel(item.slot)})`);
      }
    }
    for (const item of this.doses()) {
      if (item.status === 'REFUSE') {
        add(item, `a refusé : ${item.label} (${slotLabel(item.slot)})`);
      } else if (item.highRisk && (item.status === 'A_FAIRE' || item.status === 'PLUS_TARD')) {
        add(item, `traitement à risque pas encore donné : ${item.label} (${slotLabel(item.slot)})`);
      }
    }
    return out;
  });

  /** Ce qui reste à faire, à transmettre tel quel. */
  protected readonly todo = computed(() => {
    const pending = (items: ServiceItem[]) =>
      items.filter((i) => i.status === 'A_FAIRE' || i.status === 'PLUS_TARD');
    return { meals: pending(this.meals()).length, doses: pending(this.doses()).length };
  });

  constructor() {
    this.loadBoard();
    this.api.listResidents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: residents => this.residents.set(residents),
      error: () => this.residentError.set(true),
    });
    timer(15_000, 15_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.saving() && !this.boardLoading() && this.closing() === null) this.loadBoard();
    });

    forkJoin({
      meals: this.api.listService('REPAS'),
      doses: this.api.listService('MEDICAMENT'),
      doubts: this.api.openDoubts(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ meals, doses, doubts }) => {
        this.meals.set(meals);
        this.doses.set(doses);
        this.doubts.set(doubts);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected loadBoard(): void {
    const revision = ++this.boardRevision;
    this.boardLoading.set(true);
    this.api.loadHandover().pipe(timeout(10000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: board => {
        if (revision !== this.boardRevision) return;
        this.board.set(board);
        this.boardError.set(null);
        this.boardLoading.set(false);
      },
      error: error => {
        if (revision !== this.boardRevision) return;
        this.boardError.set(errorMessage(error));
        this.boardLoading.set(false);
      },
    });
  }

  protected save(formDirective: FormGroupDirective): void {
    if (this.saving() || this.closing() !== null || this.form.disabled) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { residentId, observation, expectedAction } = this.form.getRawValue();
    const request: HandoverRequest = {
      requestId: this.draftId ??= createRequestId(),
      residentId,
      observation: observation.trim(),
      expectedAction: expectedAction.trim(),
    };
    this.saving.set(true);
    this.ref.disableClose = true;
    this.form.disable();
    this.formError.set(null);
    this.api.createHandover(request).pipe(timeout(10000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.finishSaving();
        this.draftId = null;
        formDirective.resetForm({ residentId: null, observation: '', expectedAction: '' });
        this.snackBar.open('Transmission enregistrée', 'Fermer', { duration: 2500 });
        this.loadBoard();
      },
      error: error => {
        this.finishSaving();
        this.formError.set(errorMessage(error));
        this.loadBoard();
      },
    });
  }

  protected assign(entry: HandoverAction, action: HandoverAssignment): void {
    if (this.closing() !== null || this.saving()) return;
    const perform = () => this.updateAction(entry,
      this.api.assignHandover(entry.id, action, entry.assignmentVersion), 'Attribution mise à jour');
    if (action !== 'TAKE_OVER') {
      perform();
      return;
    }
    this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Reprendre cette action',
        message: `Cette action est attribuée à ${entry.assigneeName}. Vérifiez avec l’équipe avant de la reprendre.`,
        confirmLabel: 'Confirmer la reprise',
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) perform();
    });
  }

  protected complete(entry: HandoverAction): void {
    this.updateAction(entry, this.api.completeHandover(entry.id, entry.assignmentVersion), 'Action terminée');
  }

  private updateAction(entry: HandoverAction, request: Observable<HandoverAction>, success: string): void {
    if (this.closing() !== null || this.saving()) return;
    this.closing.set(entry.id);
    this.actionError.set(null);
    request.pipe(timeout(10000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closing.set(null);
        this.loadBoard();
        this.snackBar.open(success, 'Fermer', { duration: 2500 });
      },
      error: error => {
        this.closing.set(null);
        this.actionError.set(errorMessage(error));
        if (error instanceof HttpErrorResponse && error.status === 409) this.loadBoard();
      },
    });
  }

  private finishSaving(): void {
    this.saving.set(false);
    this.ref.disableClose = false;
    this.form.enable();
  }

  protected readonly residentName = fullName;

  protected slotText(slot: string): string {
    return slotLabel(slot);
  }

  protected copy(): void {
    const text = this.asText();
    const done = () => this.snackBar.open('Résumé copié', 'OK', { duration: 3000 });
    const failed = () => this.snackBar.open("Copie impossible : sélectionnez le texte à la main", 'OK', { duration: 5000 });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, failed);
    } else {
      failed();
    }
  }

  private lines(items: ServiceItem[]): SlotLine[] {
    const order: string[] = [];
    for (const item of items) {
      if (!order.includes(item.slot)) {
        order.push(item.slot);
      }
    }
    return order.map((slot) => {
      const inSlot = items.filter((i) => i.slot === slot);
      return {
        slot,
        done: inSlot.filter((i) => i.status === 'FAIT' || i.status === 'REFUSE' || i.status === 'ABSENT').length,
        total: inSlot.length,
      };
    });
  }

  private asText(): string {
    const out: string[] = [`Relève du ${this.now.toLocaleDateString('fr-FR')} à ${this.now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`];
    out.push('', 'Repas : ' + (this.mealLines().map((l) => `${slotLabel(l.slot)} ${l.done}/${l.total}`).join(', ') || 'aucun'));
    out.push('Médicaments : ' + (this.doseLines().map((l) => `${slotLabel(l.slot)} ${l.done}/${l.total}`).join(', ') || 'aucun'));
    out.push(`Reste à faire : ${this.todo().meals} repas, ${this.todo().doses} prises`);
    if (this.doubts().length > 0) {
      out.push('', "Doutes d'identité à lever :");
      for (const d of this.doubts()) {
        out.push(`- ${d.residentName}`);
      }
    }
    if (this.alerts().length > 0) {
      out.push('', 'À surveiller :');
      for (const a of this.alerts()) {
        out.push(`- ${a.residentName}${a.room ? ' (ch. ' + a.room + ')' : ''} : ${a.text}`);
      }
    } else {
      out.push('', 'Rien de particulier à signaler.');
    }
    return out.join('\n');
  }
}
