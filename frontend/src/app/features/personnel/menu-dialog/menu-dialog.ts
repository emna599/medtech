import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { DAY_LABEL, DiningSlot, MenuEntry, WeeklyMenu } from '../../../shared/models/personnel.model';

interface DayMenu {
  day: number;
  label: string;
  today: boolean;
  meals: { slot: DiningSlot; title: string; entry: MenuEntry | null }[];
}

/** Date locale AAAA-MM-JJ (toISOString donnerait la date UTC). */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Menu de la semaine (déjeuner et dîner, du lundi au dimanche), avec navigation d'une semaine à l'autre. */
@Component({
  selector: 'app-menu-dialog',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './menu-dialog.html',
  styleUrl: './menu-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<MenuDialog>>(MatDialogRef);

  /** Décalage en semaines par rapport à aujourd'hui. */
  protected readonly offset = signal(0);
  protected readonly menu = signal<WeeklyMenu | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly title = computed(() => {
    const menu = this.menu();
    if (!menu) {
      return 'Menu de la semaine';
    }
    const [year, month, day] = menu.weekStart.split('-').map(Number);
    const monday = new Date(year, month - 1, day);
    return `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
  });

  protected readonly days = computed<DayMenu[]>(() => {
    const menu = this.menu();
    const todayWeekday = ((new Date().getDay() + 6) % 7) + 1;
    return DAY_LABEL.slice(1).map((label, i) => ({
      day: i + 1,
      label,
      today: this.offset() === 0 && todayWeekday === i + 1,
      meals: (['DEJEUNER', 'DINER'] as const).map((slot) => ({
        slot,
        title: slot === 'DEJEUNER' ? 'Déjeuner' : 'Dîner',
        entry: menu?.entries.find((e) => e.dayOfWeek === i + 1 && e.mealType === slot) ?? null,
      })),
    }));
  });

  constructor() {
    this.load();
  }

  protected shift(weeks: number): void {
    this.offset.update((value) => value + weeks);
    this.load();
  }

  protected close(): void {
    this.ref.close();
  }

  private load(): void {
    const date = new Date();
    date.setDate(date.getDate() + this.offset() * 7);
    this.loading.set(true);
    this.error.set(null);
    this.api.weeklyMenu(isoDate(date)).subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
