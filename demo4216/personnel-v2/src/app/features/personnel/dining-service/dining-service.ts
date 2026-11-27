import { Observable } from 'rxjs';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
  DiningSlot,
  DiningTable,
  fullName,
  isMealFinished,
  Reading,
  seatSlots,
  ServiceStatus,
} from '../../../shared/models/personnel.model';
import { nfcProblem, nfcSupported, scanNfcOnce } from '../components/nfc-reader';
import { ResidentAvatar } from '../components/resident-avatar';
import { IdentifyDialog, IdentifyResult, ScanDialogData } from '../identify-dialog/identify-dialog';
import { MenuDialog } from '../menu-dialog/menu-dialog';
import { RfidPointage } from '../rfid-pointage';

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
    inject(DestroyRef).onDestroy(() => this.cancelScan?.());
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

  // ---------- Téléphone = table : la carte de cantine (NFC) joue le bracelet du résident ----------

  protected readonly nfcOk = nfcSupported();
  protected readonly nfcHint = nfcProblem();
  /** Lecteur RFID joué par ce téléphone (vide = première table). */
  protected readonly phoneReader = signal('');
  protected readonly scanning = signal(false);
  protected readonly unknownCard = signal<string | null>(null);
  protected readonly linkQuery = signal('');
  protected readonly linkResidents = signal<DiningSeat['resident'][]>([]);
  private cancelScan: (() => void) | null = null;

  protected readonly phoneReaderCode = computed(
    () => this.phoneReader() || this.raw()?.tables.find((table) => table.readerCode)?.readerCode || '',
  );
  protected readonly phoneTableLabel = computed(
    () => this.raw()?.tables.find((table) => table.readerCode === this.phoneReaderCode())?.label ?? '',
  );

  /** Bouton « Lire » : allume les lecteurs et écoute UNE carte sur le NFC du téléphone (rien n'est lu avant l'appui). */
  protected read(): void {
    const first = !this.active();
    this.active.set(true);
    this.load(true, true, first);
    if (this.nfcOk && this.phoneReaderCode()) {
      this.startScan();
    }
  }

  private startScan(): void {
    this.cancelScan?.();
    this.unknownCard.set(null);
    this.scanning.set(true);
    this.cancelScan = scanNfcOnce({
      tag: (token) => {
        this.scanning.set(false);
        this.sendReading(this.phoneReaderCode(), null, false, undefined, token);
      },
      error: (message) => {
        this.scanning.set(false);
        this.snackBar.open(message, 'OK', { duration: 6000 });
      },
    });
  }

  /** Carte inconnue : on l'associe au résident choisi, puis il s'assoit à la table de ce téléphone. */
  protected linkAndSeat(): void {
    const token = this.unknownCard();
    const label = normalize(this.linkQuery());
    const resident = this.linkResidents().find((r) => normalize(this.residentLabel(r)) === label);
    if (!token || !resident || this.busy()) {
      this.snackBar.open('Choisissez un résident dans la liste.', 'OK', { duration: 4000 });
      return;
    }
    const reader = this.phoneReaderCode();
    this.busy.set(true);
    this.api.linkNfc(resident.id, token).subscribe({
      next: () => {
        this.unknownCard.set(null);
        this.linkQuery.set('');
        this.busy.set(false);
        this.sendReading(reader, null, false, undefined, token);
      },
      error: (err) => {
        this.busy.set(false);
        this.snackBar.open(errorMessage(err), 'OK', { duration: 6000 });
      },
    });
  }

  protected residentLabel(resident: DiningSeat['resident']): string {
    return `${resident.lastName} ${resident.firstName} · chambre ${resident.room ?? "—"}`;
  }

  /** Éteint les lecteurs : les tables se vident à l'écran. */
  protected stop(): void {
    this.cancelScan?.();
    this.cancelScan = null;
    this.scanning.set(false);
    this.unknownCard.set(null);
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
    this.selected.set({ tableId: table.id, tableLabel: table.label, seat });
  }

  protected closeDetail(): void {
    this.selected.set(null);
  }

  /** Case « Fait » : le repas est servi (validé tout de suite, comme sur l'écran des soignants). */
  protected readonly mealStatus: Record<ServiceStatus | 'ABSENT', string> = {
    A_FAIRE: 'Repas à servir', FAIT: 'Repas servi', ABSENT: 'Absent', REFUSE: 'Repas refusé', PLUS_TARD: 'Repas reporté',
  };
  protected readonly chevaletNumber = signal('');
  protected readonly validChevalet = computed(() => /^[1-9][0-9]{0,3}$/.test(this.chevaletNumber().trim()));

  protected assignChevalet(seat: DiningSeat): void {
    if (!this.validChevalet()) return;
    this.saveChevalet(this.api.assignDiningChevalet(seat.resident.id, this.chevaletNumber().trim()));
  }

  protected releaseChevalet(seat: DiningSeat): void {
    if (seat.chevalet) this.saveChevalet(this.api.releaseDiningChevalet(seat.resident.id, seat.chevalet));
  }

  private saveChevalet(request: Observable<void>): void {
    if (this.busy()) return;
    this.busy.set(true);
    request.subscribe({
      next: () => { this.busy.set(false); this.chevaletNumber.set(''); this.load(true); },
      error: error => { this.busy.set(false); this.snackBar.open(errorMessage(error), 'OK', { duration: 5000 }); },
    });
  }

  /** Simule le départ : le résident se lève, son bracelet n'est plus lu par la table. */
  protected leave(table: DiningTable, seat: DiningSeat): void {
    this.sendReading(table.readerCode, seat.resident.id, true);
  }

  private sendReading(readerCode: string | null, residentId: number | null, leaving: boolean, onSuccess?: () => void, token?: string): void {
    if (!readerCode || this.busy()) {
      this.snackBar.open('Choisissez une table avec un lecteur RFID.', 'OK', { duration: 4000 });
      return;
    }
    this.busy.set(true);
    this.api.sendReading(readerCode, residentId, leaving, token).subscribe({
      next: (reading: Reading) => {
        this.busy.set(false);
        this.snackBar.open(reading.message, 'OK', { duration: 3000 });
        onSuccess?.();
        this.load(true);
      },
      error: (err) => {
        this.busy.set(false);
        if (token && err?.status === 404 && String(errorMessage(err)).toLowerCase().includes('bracelet')) {
          this.unknownCard.set(token);
          if (this.linkResidents().length === 0) {
            this.api.demoNfcResidents().subscribe({ next: (list) => this.linkResidents.set(list), error: (error) => this.snackBar.open(errorMessage(error), "OK", { duration: 6000 }) });
          }
          return;
        }
        this.snackBar.open(errorMessage(err), 'OK', { duration: 6000 });
      },
    });
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
    this.active.set(true);
    for (const table of this.raw()?.tables ?? []) {
      const seat = table.seats.find((s) => s.resident.id === residentId);
      if (seat) {
        this.search.set('');
        this.select(table, seat);
        return;
      }
    }
    this.arrivalResident.set(residentId);
    this.arrivalReader.set('');
  }

  protected readonly arrivalResident = signal<number | null>(null);
  protected readonly arrivalReader = signal('');

  protected installResident(): void {
    const residentId = this.arrivalResident();
    const reader = this.arrivalReader();
    if (!residentId || !reader) return;
    this.sendReading(reader, residentId, false, () => this.arrivalResident.set(null));
  }

  protected openMenu(): void {
    this.dialog.open(MenuDialog, { maxWidth: '100vw', autoFocus: false });
  }

  protected openPointage(): void {
    this.dialog.open(RfidPointage, { width: '520px', maxWidth: '96vw' });
  }
}
