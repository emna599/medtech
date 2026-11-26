import { DatePipe } from '@angular/common';
import { DiningDialog } from './dining-dialog/dining-dialog';
import { NotesDialog } from './notes-dialog/notes-dialog';
import { PlanningDialog, PlanningResult } from './planning-dialog/planning-dialog';
import { TeamDialog } from './team-dialog/team-dialog';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, filter, fromEvent, map, merge, timer } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage, PersonnelService } from '../../core/services/personnel.service';
import { TourUpdatesService } from '../../core/services/tour-updates.service';
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
import { AssistantDialog, AssistantResult } from './assistant-dialog/assistant-dialog';
import { ResidentsDialog, ResidentsResult } from './residents-dialog/residents-dialog';
import { ReleveDialog } from './releve-dialog/releve-dialog';
import { IdentifyDialog, IdentifyResult } from './identify-dialog/identify-dialog';
import { ResidentSheet, ResidentSheetData, ResidentSheetResult } from './resident-sheet/resident-sheet';

type StatusFilter = 'A_FAIRE' | 'FAIT' | 'TOUS';

const PENDING: readonly ServiceStatus[] = ['A_FAIRE', 'PLUS_TARD'];
const FINISHED: readonly ServiceStatus[] = ['FAIT', 'REFUSE', 'ABSENT'];

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
    DatePipe,
    MatButtonModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatIconModule,
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
  private requestRevision = 0;
  private readonly destroyRef = inject(DestroyRef);
  private readonly chosenSlot = signal<string | null>(null);

  protected readonly items = signal<ServiceItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly refreshUnavailable = signal(false);
  protected readonly lastRefresh = signal<Date | null>(null);
  protected readonly changedMealResidents = computed(() => [...new Set(this.items()
    .filter(item => item.kind === 'REPAS' && PENDING.includes(item.status)
      && !!item.resident.mealInstructionsChangedAt)
    .map(item => fullName(item.resident)))]);


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

  protected readonly kitchenSheetOpen = signal(false);
  protected readonly kitchenMeals = computed(() => this.slotItems().filter(
    item => item.kind === 'REPAS' && PENDING.includes(item.status),
  ));
  protected readonly kitchenRows = computed(() => {
    const rows = new Map<string, { key: string; texture: string; regime: string; count: number; check: number }>();
    for (const { resident } of this.kitchenMeals()) {
      const texture = resident.texture?.trim() || 'À vérifier';
      const regime = resident.regime?.trim() || 'À vérifier';
      const key = JSON.stringify([texture, regime]);
      const row = rows.get(key) ?? { key, texture, regime, count: 0, check: 0 };
      row.count++;
      if (!resident.texture?.trim() || !resident.regime?.trim() || resident.mealTextureConflict
        || resident.mealInstructionsChangedAt || resident.allergies.length || resident.restrictions
        || resident.instructions || resident.identityDoubt) {
        row.check++;
      }
      rows.set(key, row);
    }
    return [...rows.values()].sort((a, b) => a.texture.localeCompare(b.texture, 'fr')
      || a.regime.localeCompare(b.regime, 'fr'));
  });

  protected printKitchenSheet(): void {
    if (!this.loading() && !this.error() && !this.refreshUnavailable() && this.kitchenMeals().length) {
      window.print();
    }
  }

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
    const residentId = inject(Router).currentNavigation()?.extras.state?.['identifiedResidentId'];
    this.load(() => {
      if (typeof residentId === 'number') this.openResident(residentId);
    });
    merge(timer(10_000, 10_000), fromEvent(window, 'online'), inject(TourUpdatesService).changes()).pipe(
      filter(() => !this.loading()),
      switchMap(() => {
        const revision = this.requestRevision;
        return this.api.listService(this.kind()).pipe(
          map(items => ({ items, revision })),
          catchError(() => {
            if (revision === this.requestRevision) this.refreshUnavailable.set(true);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ items, revision }) => {
      if (revision === this.requestRevision) {
        this.items.set(items);
        this.lastRefresh.set(new Date());
        this.refreshUnavailable.set(false);
      }
    });
  }

  protected setKind(kind: ServiceKind): void {
    if (kind === this.kind()) {
      return;
    }
    this.kitchenSheetOpen.set(false);
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
    const revision = ++this.requestRevision;
    this.loading.set(true);
    this.error.set(null);
    this.api.listService(requested).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        if (revision !== this.requestRevision) {
          return; // réponse périmée : l'utilisateur a changé de type entre-temps
        }
        this.items.set(items);
        this.lastRefresh.set(new Date());
        this.refreshUnavailable.set(false);
        this.loading.set(false);
        onDone?.();
      },
      error: (err: unknown) => {
        if (revision !== this.requestRevision) {
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

  protected openDining(): void {
    this.dialog.open<DiningDialog, void, { residentId: number; mealId: number }>(DiningDialog, {
      width: '960px',
      maxWidth: '96vw',
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selection) => {
      if (!selection) return;
      this.kind.set('REPAS');
      this.chosenSlot.set(null);
      this.load(() => {
        const meal = this.items().find(item => item.id === selection.mealId && item.resident.id === selection.residentId);
        if (meal) {
          this.setSlot(meal.slot);
          this.setLocation(meal.resident.mealLocation);
          this.open(meal);
        } else {
          this.snackBar.open('Ce repas n’est plus disponible dans la tournée.', 'OK', { duration: 5000 });
        }
      });
    });
  }

  protected openPlanning(): void {
    this.dialog.open<PlanningDialog, void, PlanningResult>(PlanningDialog, { width: '680px', maxWidth: '96vw' })
      .afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
        if (result?.focus) this.setKind(result.focus);
      });
  }

  protected openTeam(): void {
    this.dialog.open(TeamDialog, { width: '680px', maxWidth: '96vw' });
  }

  protected openNotes(): void {
    this.dialog.open(NotesDialog, { width: '680px', maxWidth: '96vw' });
  }

  protected openIdentify(): void {
    const ref = this.dialog.open<IdentifyDialog, undefined, IdentifyResult>(IdentifyDialog, {
      width: '560px',
      maxWidth: '100vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.openResident(result.residentId);
      }
    });
  }

  protected openResidents(): void {
    const ref = this.dialog.open<ResidentsDialog, undefined, ResidentsResult>(ResidentsDialog, {
      maxWidth: '100vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.openResident(result.residentId);
      }
    });
  }

  protected openReleve(): void {
    this.dialog.open(ReleveDialog, { maxWidth: '100vw', autoFocus: false });
  }

  protected openAssistant(): void {
    const ref = this.dialog.open<AssistantDialog, undefined, AssistantResult>(AssistantDialog, {
      maxWidth: '100vw',
      panelClass: 'assistant-panel',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      if (result.action) {
        const action = result.action;
        this.chosenSlot.set(null);
        this.kind.set(action.kind);
        this.load(() => {
          const item = this.items().find(entry => entry.id === action.itemId);
          if (item) {
            this.setSlot(item.slot);
            this.setLocation(item.resident.mealLocation);
            this.open(item);
          } else {
            this.snackBar.open('Cette action ne figure plus dans la tournée.', 'OK', { duration: 5000 });
          }
        });
      } else {
        this.openResidentIfAny(result.residentId);
      }
    });
  }

  private openResidentIfAny(residentId: number | undefined): void {
    if (residentId !== undefined) {
      this.openResident(residentId);
    }
  }

  /** Ouvre la fiche du résident pour le service en cours (ou la plus pertinente s'il y en a plusieurs). */
  private openResident(residentId: number): void {
    const candidates = this.items().filter((item) => item.resident.id === residentId);
    const target =
      candidates.find((item) => PENDING.includes(item.status) && item.slot === this.currentSlot()) ??
      candidates.find((item) => PENDING.includes(item.status)) ??
      candidates[0];
    if (target) {
      this.open(target);
    } else {
      this.snackBar.open('Rien à faire pour cette personne en ce moment', 'OK', { duration: 5000 });
    }
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
      case 'ABSENT':
        return 'Absent';
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
      case 'ABSENT':
        return 'is-absent';
      case 'REFUSE':
        return 'is-refused';
      case 'PLUS_TARD':
        return 'is-later';
      default:
        return 'is-todo';
    }
  }

  protected statusIcon(item: ServiceItem): string {
    switch (item.status) {
      case 'FAIT':
        return 'check_circle';
      case 'ABSENT':
        return 'person_off';
      case 'REFUSE':
        return 'cancel';
      case 'PLUS_TARD':
        return 'schedule';
      default:
        return 'pending_actions';
    }
  }

  private remaining(location: MealLocation): number {
    return this.slotItems().filter(
      (item) => item.resident.mealLocation === location && PENDING.includes(item.status),
    ).length;
  }
}
