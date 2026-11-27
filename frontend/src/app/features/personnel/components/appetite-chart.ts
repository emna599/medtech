import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { PersonnelService } from '../../../core/services/personnel.service';
import { Appetite } from '../../../shared/models/personnel.model';

interface Bar {
  key: string;
  label: string;
  title: string;
  height: number;
  level: 'good' | 'mid' | 'low' | 'none';
}

/** Petit graphique de l'appétit des 7 derniers jours (une barre par jour), avec alerte en cas de baisse. */
@Component({
  selector: 'app-appetite-chart',
  template: `
    @if (data(); as appetite) {
      @if (appetite.recentAverage !== null) {
        <section class="box" [class.box-alert]="appetite.declining" aria-label="Appétit des 7 derniers jours">
          <p class="title">
            Appétit · 7 jours
            <span class="verdict">
              {{ appetite.declining ? '⚠ en baisse' : 'stable' }}
            </span>
          </p>
          <div class="bars" role="img" [attr.aria-label]="summary()">
            @for (bar of bars(); track bar.key) {
              <div class="col" [title]="bar.title">
                <div class="track">
                  <div class="bar" [class]="'bar ' + bar.level" [style.height.%]="bar.height"></div>
                </div>
                <span class="day">{{ bar.label }}</span>
              </div>
            }
          </div>
        </section>
      }
    }
  `,
  styles: `
    .box {
      margin: 0 0 12px;
      padding: 10px 14px 8px;
      border-radius: 16px;
      border: 1.5px solid var(--app-line);
      background: var(--app-surface-2);
    }
    .box-alert {
      border-color: var(--brand-coral, #e8715a);
      background: var(--app-warn-bg, #fff0ec);
    }
    .title {
      display: flex;
      justify-content: space-between;
      margin: 0 0 6px;
      font-weight: 800;
      font-size: 14px;
    }
    .verdict {
      font-weight: 700;
    }
    .box-alert .verdict {
      color: var(--app-warn, #c9563e);
    }
    .bars {
      display: flex;
      gap: 6px;
      align-items: flex-end;
    }
    .col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .track {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: flex-end;
      border-radius: 6px;
      background: var(--app-line-soft);
    }
    .bar {
      width: 100%;
      min-height: 4px;
      border-radius: 6px;
    }
    .good {
      background: var(--app-ok, #0f766e);
    }
    .mid {
      background: #e0a43a;
    }
    .low {
      background: var(--app-danger, #b3261e);
    }
    .none {
      height: 0 !important;
      min-height: 0;
    }
    .day {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppetiteChart {
  private readonly api = inject(PersonnelService);

  readonly residentId = input.required<number>();
  protected readonly data = signal<Appetite | null>(null);

  protected readonly bars = computed<Bar[]>(() => {
    const appetite = this.data();
    if (!appetite) {
      return [];
    }
    return appetite.days.map((day) => {
      const date = new Date(day.date + 'T00:00:00');
      const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const score = day.score;
      const level: Bar['level'] = score === null ? 'none' : score >= 0.6 ? 'good' : score >= 0.3 ? 'mid' : 'low';
      const percent = score === null ? 0 : Math.round(score * 100);
      return {
        key: day.date,
        label: weekday.charAt(0).toUpperCase(),
        title: score === null ? `${weekday} : pas de repas noté` : `${weekday} : ${percent} % mangé`,
        height: Math.max(score === null ? 0 : 6, percent),
        level,
      };
    });
  });

  protected readonly summary = computed(() => {
    const appetite = this.data();
    if (!appetite || appetite.recentAverage === null) {
      return '';
    }
    const percent = Math.round(appetite.recentAverage * 100);
    return `Environ ${percent} % des repas mangés ces derniers jours, ${appetite.declining ? 'en baisse' : 'stable'}.`;
  });

  constructor() {
    effect(() => {
      const id = this.residentId();
      untracked(() => {
        this.data.set(null);
        this.api.appetite(id).subscribe({
          next: (appetite) => {
            if (id === this.residentId()) {
              this.data.set(appetite);
            }
          },
          error: () => this.data.set(null), // information secondaire : on n'affiche rien en cas d'erreur
        });
      });
    });
  }
}
