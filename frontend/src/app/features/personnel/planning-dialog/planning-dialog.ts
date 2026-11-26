import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import {
  currentTaskIndices,
  JOB_LABEL,
  Planning,
  PlanningTask,
  ServiceKind,
  SHIFT_LABEL,
} from '../../../shared/models/personnel.model';

export interface PlanningResult {
  /** Service à ouvrir sur l'écran principal. */
  focus: ServiceKind;
}

const KIND_ICON: Record<PlanningTask['kind'], string> = {
  TRANSMISSION: 'forum',
  TOURNEE: 'directions_walk',
  REPAS: 'restaurant',
  SOINS: 'healing',
  PAUSE: 'free_breakfast',
};

/** Planning type du soignant (fixe, selon sa fonction et son équipe), avec la plage en cours mise en avant. */
@Component({
  selector: 'app-planning-dialog',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './planning-dialog.html',
  styleUrl: './planning-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<PlanningDialog, PlanningResult>>(MatDialogRef);

  protected readonly planning = signal<Planning | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly title = computed(() => {
    const planning = this.planning();
    return planning ? `${JOB_LABEL[planning.job]} · ${SHIFT_LABEL[planning.shift]}` : '';
  });

  /** Plusieurs plages peuvent être en cours en même temps (tournée de médicaments et distribution des repas). */
  protected readonly currentIndices = computed(() => {
    const planning = this.planning();
    if (!planning) {
      return [] as number[];
    }
    const now = new Date();
    return currentTaskIndices(planning.tasks, planning.shift, now.getHours() * 60 + now.getMinutes());
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.planning().subscribe({
      next: (planning) => {
        this.planning.set(planning);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected icon(task: PlanningTask): string {
    return KIND_ICON[task.kind];
  }

  protected focusLabel(task: PlanningTask): string {
    return task.focus === 'MEDICAMENT' ? 'Ouvrir les médicaments' : 'Ouvrir les repas';
  }

  protected open(task: PlanningTask): void {
    if (task.focus) {
      this.ref.close({ focus: task.focus });
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
