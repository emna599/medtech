import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { ResidentDaily } from '../../../shared/components/resident-daily/resident-daily';
import { fullName, ResidentCard } from '../../../shared/models/personnel.model';
import { AppetiteChart } from '../components/appetite-chart';
import { ResidentAvatar } from '../components/resident-avatar';

export interface ResidentsResult {
  /** Résident dont on veut ouvrir le service du jour. */
  residentId: number;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Consulter et rechercher les résidents (tous, pas seulement ceux du service en cours).
 * Fiche du personnel et suivi quotidien du résident.
 */
@Component({
  selector: 'app-residents-dialog',
  imports: [
    ResidentDaily,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AppetiteChart,
    ResidentAvatar,
  ],
  templateUrl: './residents-dialog.html',
  styleUrl: './residents-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentsDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<ResidentsDialog, ResidentsResult>>(MatDialogRef);

  protected readonly residents = signal<ResidentCard[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly selected = signal<ResidentCard | null>(null);

  protected readonly visible = computed(() => {
    const needle = normalize(this.search());
    const all = this.residents();
    if (!needle) {
      return all;
    }
    return all.filter((r) => normalize(`${r.firstName} ${r.lastName} ${r.room ?? ''}`).includes(needle));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listResidents().subscribe({
      next: (residents) => {
        this.residents.set(residents);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected name(resident: ResidentCard): string {
    return fullName(resident);
  }

  protected roomText(resident: ResidentCard): string {
    if (!resident.room) {
      return 'Sans chambre';
    }
    return resident.floor === null ? `Chambre ${resident.room}` : `Chambre ${resident.room} · étage ${resident.floor}`;
  }

  protected whereText(resident: ResidentCard): string {
    return resident.mealLocation === 'CHAMBRE' ? 'Mange dans sa chambre' : 'Mange en salle à manger';
  }

  protected select(resident: ResidentCard): void {
    this.selected.set(resident);
  }

  protected back(): void {
    this.selected.set(null);
  }

  protected openService(resident: ResidentCard): void {
    this.ref.close({ residentId: resident.id });
  }

  protected close(): void {
    this.ref.close();
  }
}
