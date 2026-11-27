import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
import { NotificationService } from '../../core/services/notification.service';
import { errorMessage, PersonnelService } from '../../core/services/personnel.service';
import { Toolbar } from '../../shared/components/toolbar/toolbar';
import {
  currentTaskIndices,
  doneLabel,
  fullName,
  MealLocation,
  Planning,
  Team,
  ServiceItem,
  ServiceKind,
  ServiceStatus,
  slotLabel,
} from '../../shared/models/personnel.model';
import { RfidPointage } from './rfid-pointage';
import { ResidentAvatar } from './components/resident-avatar';
import { DiningService } from './dining-service/dining-service';
import { AssistantDialog, AssistantResult } from './assistant-dialog/assistant-dialog';
import { ResidentsDialog, ResidentsResult } from './residents-dialog/residents-dialog';
import { TeamDialog } from './team-dialog/team-dialog';
import { ReleveDialog } from './releve-dialog/releve-dialog';
import { IdentifyDialog, IdentifyResult, ScanDialogData } from './identify-dialog/identify-dialog';
import { NotesDialog } from './notes-dialog/notes-dialog';
import { PlanningDialog, PlanningResult } from './planning-dialog/planning-dialog';
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
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ResidentAvatar,
    DiningService,
  ],
  templateUrl: './personnel-dashboard.html',
  styleUrl: './personnel-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonnelDashboard {
  private readonly api = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly alerts = inject(NotificationService);

  protected readonly kind = signal<ServiceKind>('REPAS');

  /** Vue « salle à manger » (tables) : toujours pour le service, et sur demande pour un soignant qui aide à servir. */
  protected readonly showDining = signal(new URLSearchParams(window.location.search).get('tables') === '1');
  protected readonly diningView = computed(() => this.diningOnly() || this.showDining());
  protected readonly location = signal<MealLocation>('SALLE');
  protected readonly statusFilter = signal<StatusFilter>('A_FAIRE');
  protected readonly search = signal('');
  private readonly chosenSlot = signal<string | null>(null);

  /** Fonction du soignant (infirmier / aide-soignant) : les médicaments sont réservés aux infirmiers. */
  protected readonly diningOnly = signal(false);
  protected readonly medicationAccess = signal(false);
  protected readonly medicationLocked = computed(() => this.kind() === 'MEDICAMENT' && !this.medicationAccess());

  /** Équipe en service et part de résidents du soignant connecté. */
  protected readonly team = signal<Team | null>(null);
  /** Afficher seulement « mes » résidents (la part calculée à partir des soignants en service). */
  protected readonly onlyMine = signal(true);
  private readonly mineIds = computed(() => {
    const team = this.team();
    return team?.present && this.onlyMine() ? new Set(team.myResidentIds) : null;
  });
  protected readonly teamLabel = computed(() => {
    const team = this.team();
    return team ? `${team.nurses} inf. · ${team.aides} AS` : 'Équipe';
  });

  /** Résidents qui portent un bracelet à scanner ; les autres s'identifient par le nom et la photo. */
  private planning: Planning | null = null;
  /** Plages du planning déjà annoncées, pour n'alerter qu'au moment où une nouvelle tâche commence. */
  private announced: Set<number> | null = null;

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

  /** Le matin (petit-déjeuner, médicaments du matin), tout se passe en chambre : pas de salle à manger. */
  protected readonly morning = computed(() => ['PETIT_DEJEUNER', 'MATIN'].includes(this.currentSlot() ?? ''));
  /** Tournée des chambres : choisie, ou imposée le matin. */
  protected readonly roomTour = computed(() => this.morning() || this.location() === 'CHAMBRE');

  private readonly slotItems = computed(() => {
    const mine = this.mineIds();
    return this.items()
      .filter((item) => item.slot === this.currentSlot())
      .filter((item) => !mine || mine.has(item.resident.id));
  });

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
      .filter((item) => this.morning() || item.resident.mealLocation === this.location())
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
      (item) => (this.morning() || item.resident.mealLocation === this.location()) && item.status === 'A_FAIRE',
    ),
  );

  constructor() {
    this.load();
    this.api.access().subscribe({
      next: (access) => {
        this.diningOnly.set(access.diningOnly);
        this.medicationAccess.set(access.medicationAccess);
        // L'infirmier donne surtout les médicaments : c'est son écran de départ (il peut passer aux repas quand il en distribue).
        if (access.medicationAccess && this.kind() === 'REPAS') {
          this.setKind('MEDICAMENT');
        }
      },
      error: () => undefined,
    });
    if (this.showDining()) return;
    this.refreshTeam();
    this.api.planning().subscribe({
      next: (planning) => {
        this.planning = planning;
        this.checkPlanning();
      },
      error: () => undefined,
    });
    // Alerte quand l'heure d'une tâche du planning arrive : on vérifie toutes les 20 secondes.
    const alertTimer = setInterval(() => this.checkPlanning(), 20_000);
    inject(DestroyRef).onDestroy(() => clearInterval(alertTimer));
    // L'équipe change au fil de la journée : on la relit chaque minute.
    const timer = setInterval(() => this.refreshTeam(), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected setKind(kind: ServiceKind): void {
    if (kind === this.kind() || (kind === 'MEDICAMENT' && !this.medicationAccess())) {
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
      data: {
        item,
        canAct: !(item.kind === 'MEDICAMENT' && !this.medicationAccess()),
      },
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
        if (result.completed && this.roomTour()) {
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

  /** Scanner : QR code pendant les repas, puce NFC pour les médicaments. */
  protected openPointage(): void {
    this.dialog.open(RfidPointage, { width: '520px', maxWidth: '96vw' })
      .afterClosed().subscribe(() => this.refreshTeam());
  }

  protected openScan(): void {
    const ref = this.dialog.open<IdentifyDialog, ScanDialogData, IdentifyResult>(IdentifyDialog, {
      data: { mode: this.kind() === 'REPAS' ? 'QR' : 'NFC', allowPochette: this.medicationAccess() },
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

  protected toggleAlerts(): void {
    void this.alerts.toggle().then(() => {
      this.snackBar.open(
        this.alerts.enabled() ? 'Alertes du planning activées' : 'Alertes du planning désactivées',
        'OK',
        { duration: 3000 },
      );
    });
  }

  /** Annonce les tâches du planning qui viennent de commencer (la première lecture ne fait que mémoriser). */
  private checkPlanning(): void {
    const planning = this.planning;
    if (!planning) {
      return;
    }
    const now = new Date();
    const current = new Set(currentTaskIndices(planning.tasks, planning.shift, now.getHours() * 60 + now.getMinutes()));
    const previous = this.announced;
    this.announced = current;
    if (previous === null) {
      return;
    }
    for (const index of current) {
      if (!previous.has(index)) {
        const task = planning.tasks[index];
        const text = `${task.start} · ${task.label}`;
        this.alerts.show('Planning', text);
        const ref = this.snackBar.open(text, task.focus ? 'Ouvrir' : 'OK', { duration: 12000 });
        if (task.focus) {
          const focus = task.focus;
          ref.onAction().subscribe(() => this.setKind(focus));
        }
      }
    }
  }

  protected openTeam(): void {
    const ref = this.dialog.open<TeamDialog, undefined, Team>(TeamDialog, { maxWidth: '100vw', autoFocus: false });
    ref.afterClosed().subscribe((team) => {
      if (team) {
        this.team.set(team);
      }
    });
  }

  private refreshTeam(): void {
    this.api.team().subscribe({ next: (team) => this.team.set(team), error: () => undefined });
  }

  protected openPlanning(): void {
    const ref = this.dialog.open<PlanningDialog, undefined, PlanningResult>(PlanningDialog, {
      maxWidth: '100vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.setKind(result.focus);
      }
    });
  }

  protected openNotes(): void {
    this.dialog.open(NotesDialog, { maxWidth: '100vw', autoFocus: false });
  }

  protected openReleve(): void {
    this.dialog.open(ReleveDialog, {
      data: { medicationAccess: this.medicationAccess() }, maxWidth: '100vw', autoFocus: false });
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
      if (result.changed) {
        this.load(() => this.openResidentIfAny(result.residentId));
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
      case 'REFUSE':
        return 'Refusé';
      case 'ABSENT':
        return 'Absent';
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
