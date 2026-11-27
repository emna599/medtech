import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import {
  Dining,
  DiningSeat,
  MenuWarning,
  DiningSlot,
  DiningTable,
  fullName,
  isMealFinished,
  Reading,
  ResidentCard,
  seatSlots,
  ServiceStatus,
} from '../../../shared/models/personnel.model';
import { ResidentAvatar } from '../components/resident-avatar';
import { IdentifyDialog, IdentifyResult, ScanDialogData } from '../identify-dialog/identify-dialog';
import { MenuDialog } from '../menu-dialog/menu-dialog';
import { PlanningDialog } from '../planning-dialog/planning-dialog';

interface SelectedSeat {
  tableId: number;
  tableLabel: string;
  seat: DiningSeat;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Interface Service : la salle à manger table par table (8 résidents au plus par table).
 * Chaque place montre le résident (nom, prénom, photo, allergies, position) et une case « Fait » quand le repas est servi.
 */
@Component({
  selector: 'app-dining-service',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ResidentAvatar,
  ],
  templateUrl: './dining-service.html',
  styleUrl: './dining-service.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiningService {
  private readonly api = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly raw = signal<Dining | null>(null);
  /**
   * Les lecteurs RFID des tables sont éteints au départ (pour économiser leur batterie) :
   * tant qu'on n'a pas appuyé sur « Lire », aucun résident n'est affiché à table.
   */
  protected readonly active = signal(false);
  protected readonly dining = computed<Dining | null>(() => {
    const data = this.raw();
    if (!data || this.active()) {
      return data;
    }
    return {
      ...data,
      seated: 0,
      served: 0,
      tables: data.tables.map((table) => ({ ...table, present: 0, served: 0, seats: [] })),
    };
  });
  protected readonly slot = signal<DiningSlot | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly selected = signal<SelectedSeat | null>(null);
  protected readonly busy = signal(false);
  protected readonly refusal = signal('');
  protected readonly refusing = signal(false);

  protected readonly fullName = fullName;
  protected readonly isFinished = isMealFinished;

  /** Plats du menu qui posent problème : pour chaque plat, les résidents regroupés par raison (allergies d'abord). */
  protected readonly dishAlerts = computed(() => {
    type Group = { reason: string; stop: boolean; people: { name: string; table: string }[] };
    const byDish = new Map<string, Map<string, Group>>();
    for (const table of this.dining()?.tables ?? []) {
      for (const seat of table.seats) {
        for (const warning of seat.warnings ?? []) {
          const groups = byDish.get(warning.dish) ?? new Map<string, Group>();
          const stop = warning.level === 'STOP';
          const group = groups.get(warning.reason) ?? { reason: warning.reason, stop, people: [] };
          group.people.push({
            name: `${seat.resident.lastName} ${seat.resident.firstName.charAt(0)}.`,
            table: table.label.replace(/^Table\s*/i, 'T'),
          });
          groups.set(warning.reason, group);
          byDish.set(warning.dish, groups);
        }
      }
    }
    return [...byDish.entries()].map(([dish, groups]) => {
      const list = [...groups.values()].sort((a, b) => Number(b.stop) - Number(a.stop) || a.reason.localeCompare(b.reason));
      return {
        dish,
        groups: list,
        count: list.reduce((sum, group) => sum + group.people.length, 0),
        stops: list.filter((group) => group.stop).length,
      };
    });
  });

  protected readonly progress = computed(() => {
    const dining = this.dining();
    return dining && dining.seated > 0 ? Math.round((dining.served / dining.seated) * 100) : 0;
  });

  /** Tables avec leurs 8 places ; la recherche ne garde que les tables où quelqu'un correspond. */
  protected readonly tables = computed(() => {
    const dining = this.dining();
    if (!dining) {
      return [];
    }
    const query = normalize(this.search());
    return dining.tables
      .map((table) => ({
        table,
        slots: seatSlots(table).map((seat) => ({
          seat,
          match: !query || (seat !== null && this.matches(seat, query)),
        })),
      }))
      .filter((entry) => !query || entry.slots.some((s) => s.match && s.seat));
  });

  constructor() {
    this.load();
  }

  private matches(seat: DiningSeat, query: string): boolean {
    const resident = seat.resident;
    return [resident.firstName, resident.lastName, resident.room ?? '', seat.chevalet ?? '']
      .some((value) => normalize(value).includes(query));
  }

  protected setSlot(slot: DiningSlot): void {
    this.slot.set(slot);
    this.selected.set(null);
    this.load();
  }

  /** Résidents qui viennent de s'asseoir (mis en évidence quelques secondes). */
  protected readonly fresh = signal<Set<number>>(new Set());

  /** Bouton « Lire » : allume les lecteurs, relit les bracelets captés par les tables et annonce le résultat. */
  protected read(): void {
    const first = !this.active();
    this.active.set(true);
    this.load(true, true, first);
  }

  /** Éteint les lecteurs : les tables se vident à l'écran. */
  protected stop(): void {
    this.active.set(false);
    this.selected.set(null);
    this.fresh.set(new Set());
  }

  protected load(silent = false, announce = false, first = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.api.dining(this.slot() ?? undefined).subscribe({
      next: (dining) => {
        const before = new Set(this.raw()?.tables.flatMap((t) => t.seats.map((s) => s.resident.id)) ?? []);
        const arrivals = dining.tables.flatMap((table) =>
          table.seats.filter((s) => !before.has(s.resident.id)).map((s) => ({ table: table.label, name: fullName(s.resident), id: s.resident.id })),
        );
        this.raw.set(dining);
        this.slot.set(dining.slot);
        this.error.set(null);
        this.loading.set(false);
        this.refreshSelection(dining);
        if (!first && this.active()) {
          this.highlight(arrivals.map((a) => a.id));
        }
        if (announce) {
          const text = first
            ? `${dining.seated} résident${dining.seated > 1 ? 's' : ''} à table`
            : arrivals.length === 0
            ? 'Aucun nouveau résident'
            : arrivals.slice(0, 3).map((a) => `${a.name} → ${a.table}`).join(' · ') + (arrivals.length > 3 ? ` (+${arrivals.length - 3})` : '');
          this.snackBar.open(text, 'OK', { duration: 5000 });
        }
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private highlight(ids: number[]): void {
    if (ids.length === 0) {
      return;
    }
    this.fresh.set(new Set(ids));
    setTimeout(() => this.fresh.set(new Set()), 8000);
  }

  private refreshSelection(dining: Dining): void {
    const current = this.selected();
    if (!current) {
      return;
    }
    const seat = dining.tables.find((t) => t.id === current.tableId)?.seats.find((s) => s.position === current.seat.position);
    this.selected.set(seat ? { ...current, seat } : null);
  }

  protected select(table: DiningTable, seat: DiningSeat): void {
    this.refusal.set('');
    this.refusing.set(false);
    this.selected.set({ tableId: table.id, tableLabel: table.label, seat });
  }

  protected closeDetail(): void {
    this.selected.set(null);
  }

  /** Case « Fait » : le repas est servi (validé tout de suite, comme sur l'écran des soignants). */
  protected markServed(seat: DiningSeat): void {
    this.complete(seat, { status: 'FAIT' });
  }

  protected refuse(seat: DiningSeat): void {
    const reason = this.refusal().trim();
    if (!reason) {
      this.snackBar.open('Indiquez le motif du refus.', 'OK', { duration: 4000 });
      return;
    }
    this.complete(seat, { status: 'REFUSE', comment: reason });
  }

  private complete(seat: DiningSeat, body: { status: 'FAIT' | 'REFUSE'; comment?: string }): void {
    if (!seat.meal || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.api.completeById('REPAS', seat.meal.id, body).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.refusing.set(false);
        this.refusal.set('');
        this.patchStatus(seat.meal!.id, item.status);
      },
      error: (err) => {
        this.busy.set(false);
        this.snackBar.open(errorMessage(err), 'OK', { duration: 6000 });
        this.load(true);
      },
    });
  }

  /** Simule le départ : le résident se lève, son bracelet n'est plus lu par la table. */
  protected leave(table: DiningTable, seat: DiningSeat): void {
    this.sendReading(table.readerCode, seat.resident.id, true);
  }

  private sendReading(readerCode: string | null, residentId: number, leaving: boolean): void {
    if (!readerCode || this.busy()) {
      this.snackBar.open('Choisissez une table avec un lecteur RFID.', 'OK', { duration: 4000 });
      return;
    }
    this.busy.set(true);
    this.api.sendReading(readerCode, residentId, leaving).subscribe({
      next: (reading: Reading) => {
        this.busy.set(false);
        this.snackBar.open(reading.message, 'OK', { duration: 3000 });
        this.load(true);
      },
      error: (err) => {
        this.busy.set(false);
        this.snackBar.open(errorMessage(err), 'OK', { duration: 6000 });
      },
    });
  }

  /** Met à jour l'écran sans recharger toute la salle. */
  private patchStatus(mealId: number, status: ServiceStatus): void {
    const dining = this.dining();
    if (!dining) {
      return;
    }
    let served = 0;
    const tables = dining.tables.map((table) => {
      const seats = table.seats.map((seat) =>
        seat.meal?.id === mealId ? { ...seat, meal: { ...seat.meal, status } } : seat,
      );
      const done = seats.filter((seat) => isMealFinished(seat.meal)).length;
      served += done;
      return { ...table, seats, served: done };
    });
    const next = { ...dining, tables, served };
    this.raw.set(next);
    this.refreshSelection(next);
  }

  /** Scanner un bracelet (NFC ou QR) ou saisir le code : la table et la fiche du résident s'affichent. */
  protected openScan(): void {
    const ref = this.dialog.open<IdentifyDialog, ScanDialogData, IdentifyResult>(IdentifyDialog, {
      data: { mode: 'QR' },
      width: '560px',
      maxWidth: '100vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.onScanned(result.residentId);
      }
    });
  }

  private onScanned(residentId: number): void {
    for (const table of this.dining()?.tables ?? []) {
      const seat = table.seats.find((s) => s.resident.id === residentId);
      if (seat) {
        this.search.set('');
        this.select(table, seat);
        return;
      }
    }
    this.snackBar.open('Ce résident n\'est pas encore installé à une table.', 'OK', { duration: 5000 });
  }

  protected openMenu(): void {
    this.dialog.open(MenuDialog, { maxWidth: '100vw', autoFocus: false });
  }

  protected openPlanning(): void {
    this.dialog.open(PlanningDialog, { maxWidth: '100vw', autoFocus: false });
  }
}
