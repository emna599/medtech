import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage, PersonnelService } from '../../core/services/personnel.service';
import { Toolbar } from '../../shared/components/toolbar/toolbar';
import {
  doneLabel,
  fullName,
  MealLocation,
  ServiceItem,
  ServiceKind,
  ServiceStatus,
  slotLabel,
} from '../../shared/models/personnel.model';
import { ResidentAvatar } from './components/resident-avatar';
import { IdentifyDialog, IdentifyResult } from './identify-dialog/identify-dialog';
import { ResidentSheet, ResidentSheetData, ResidentSheetResult } from './resident-sheet/resident-sheet';

type StatusFilter = 'A_FAIRE' | 'FAIT' | 'TOUS';

const PENDING: readonly ServiceStatus[] = ['A_FAIRE', 'PLUS_TARD'];
const FINISHED: readonly ServiceStatus[] = ['FAIT', 'REFUSE'];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** À faire en premier, puis les reportés, puis ce qui est terminé. */
function rank(status: ServiceStatus): number {
  if (status === 'A_FAIRE') {
    return 0;
  }
  return status === 'PLUS_TARD' ? 1 : 2;
}

/** Espace personnel : repas à servir et médicaments à donner, en salle à manger ou en chambre. */
@Component({
  selector: 'app-personnel-dashboard',
  imports: [
    FormsModule,
    Toolbar,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ResidentAvatar,
  ],
  templateUrl: './personnel-dashboard.html',
  styleUrl: './personnel-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonnelDashboard {
  private readonly api = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly kind = signal<ServiceKind>('REPAS');
  protected readonly location = signal<MealLocation>('SALLE');
  protected readonly statusFilter = signal<StatusFilter>('A_FAIRE');
  protected readonly search = signal('');
  private readonly chosenSlot = signal<string | null>(null);

  protected readonly items = signal<ServiceItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Créneaux disponibles (déjeuner, dîner... ou matin, midi, soir), dans l'ordre de la journée. */
  protected readonly slots = computed(() => {
    const seen: string[] = [];
    for (const item of this.items()) {
      if (!seen.includes(item.slot)) {
        seen.push(item.slot);
      }
    }
    return seen;
  });

  /** Créneau affiché : celui choisi, sinon le premier qui a encore quelque chose à faire. */
  protected readonly currentSlot = computed(() => {
    const slots = this.slots();
    const chosen = this.chosenSlot();
    if (chosen && slots.includes(chosen)) {
      return chosen;
    }
    const firstPending = this.items().find((item) => PENDING.includes(item.status));
    return firstPending?.slot ?? slots[0] ?? null;
  });

  private readonly slotItems = computed(() => this.items().filter((item) => item.slot === this.currentSlot()));

  protected readonly total = computed(() => this.slotItems().length);
  protected readonly finished = computed(
    () => this.slotItems().filter((item) => FINISHED.includes(item.status)).length,
  );
  protected readonly progress = computed(() => (this.total() === 0 ? 0 : (this.finished() / this.total()) * 100));

  protected readonly remainingSalle = computed(() => this.remaining('SALLE'));
  protected readonly remainingChambre = computed(() => this.remaining('CHAMBRE'));

  protected readonly visible = computed(() => {
    const needle = normalize(this.search());
    const filter = this.statusFilter();
    return this.slotItems()
      .filter((item) => item.resident.mealLocation === this.location())
      .filter((item) => {
        if (filter === 'A_FAIRE') {
          return PENDING.includes(item.status);
        }
        return filter === 'FAIT' ? FINISHED.includes(item.status) : true;
      })
      .filter((item) => {
        if (!needle) {
          return true;
        }
        const r = item.resident;
        return normalize(`${r.firstName} ${r.lastName} ${r.room ?? ''}`).includes(needle);
      })
      .sort((a, b) => rank(a.status) - rank(b.status));
  });

  protected readonly nextPending = computed(() =>
    this.slotItems().find(
      (item) => item.resident.mealLocation === this.location() && item.status === 'A_FAIRE',
    ),
  );

  constructor() {
    this.load();
  }

  protected setKind(kind: ServiceKind): void {
    if (kind === this.kind()) {
      return;
    }
    this.kind.set(kind);
    this.chosenSlot.set(null);
    this.items.set([]);
    this.load();
  }

  protected setSlot(slot: string): void {
    this.chosenSlot.set(slot);
  }

  protected setLocation(location: MealLocation): void {
    this.location.set(location);
  }

  protected setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  protected load(onDone?: () => void): void {
    const requested = this.kind();
    this.loading.set(true);
    this.error.set(null);
    this.api.listService(requested).subscribe({
      next: (items) => {
        if (requested !== this.kind()) {
          return; // réponse périmée : l'utilisateur a changé de type entre-temps
        }
        this.items.set(items);
        this.loading.set(false);
        onDone?.();
      },
      error: (err: unknown) => {
        if (requested !== this.kind()) {
          return;
        }
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // ------------------------------------------------------------------ ouverture des fiches

  protected open(item: ServiceItem): void {
    const ref = this.dialog.open<ResidentSheet, ResidentSheetData, ResidentSheetResult>(ResidentSheet, {
      data: { item },
      width: '680px',
      maxWidth: '100vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result?.changed) {
        return;
      }
      this.load(() => {
        // En tournée de chambres : on enchaîne sur le résident suivant.
        if (result.completed && this.location() === 'CHAMBRE') {
          this.openNext(true);
        }
      });
    });
  }

  /** Démarre ou poursuit la tournée : ouvre la fiche du prochain résident à faire. */
  protected openNext(announceEnd = false): void {
    const next = this.nextPending();
    if (next) {
      this.open(next);
    } else if (announceEnd) {
      this.snackBar.open('Tournée terminée', 'OK', { duration: 4000 });
    }
  }

  protected openIdentify(): void {
    const ref = this.dialog.open<IdentifyDialog, undefined, IdentifyResult>(IdentifyDialog, {
      width: '560px',
      maxWidth: '100vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const candidates = this.items().filter((item) => item.resident.id === result.residentId);
      const target =
        candidates.find((item) => PENDING.includes(item.status) && item.slot === this.currentSlot()) ??
        candidates.find((item) => PENDING.includes(item.status)) ??
        candidates[0];
      if (target) {
        this.open(target);
      } else {
        this.snackBar.open('Rien à faire pour cette personne en ce moment', 'OK', { duration: 5000 });
      }
    });
  }

  // ------------------------------------------------------------------ affichage

  protected slotText(slot: string): string {
    return slotLabel(slot);
  }

  protected name(item: ServiceItem): string {
    return fullName(item.resident);
  }

  protected statusText(item: ServiceItem): string {
    switch (item.status) {
      case 'FAIT':
        return doneLabel(item.kind);
      case 'REFUSE':
        return 'Refusé';
      case 'PLUS_TARD':
        return 'Plus tard';
      default:
        return 'À faire';
    }
  }

  protected statusClass(item: ServiceItem): string {
    switch (item.status) {
      case 'FAIT':
        return 'is-done';
      case 'REFUSE':
        return 'is-refused';
      case 'PLUS_TARD':
        return 'is-later';
      default:
        return 'is-todo';
    }
  }

  protected firstAllergy(item: ServiceItem): string | null {
    const allergies = item.resident.allergies;
    if (allergies.length === 0) {
      return null;
    }
    return allergies.length > 1 ? `${allergies[0].name} +${allergies.length - 1}` : allergies[0].name;
  }

  private remaining(location: MealLocation): number {
    return this.slotItems().filter(
      (item) => item.resident.mealLocation === location && PENDING.includes(item.status),
    ).length;
  }
}
