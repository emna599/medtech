import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { CountUp } from '../../shared/directives/count-up';
import { ALL_ROLES } from '../../shared/models/user.model';
import { ROLE_LABEL } from '../../shared/models/auth.model';
import { DashboardStats } from '../../shared/models/dashboard.model';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { AdminDashboardService } from './admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CountUp, DatePipe, MatCardModule, MatIconModule, MatProgressBarModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de l'établissement</p>
      </div>
    </header>
    <div class="stack">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (stats(); as s) {
        @if (s.unassignedResidents > 0) {
          <p class="notice">
            <mat-icon fontSet="material-symbols-outlined">info</mat-icon>
            {{ s.unassignedResidents }} résident(s) actif(s) sans chambre.
            <a class="link" routerLink="/admin/residents">Voir les résidents</a>
          </p>
        }

        <section class="kpis">
          <mat-card appearance="outlined">
            <mat-card-content>
              <span class="ico"><mat-icon fontSet="material-symbols-outlined">elderly</mat-icon></span>
              <div class="value"><span [appCountUp]="s.activeResidents"></span></div>
              <div class="label">Résidents actifs</div>
              <div class="sub">{{ s.inactiveResidents }} inactif(s)</div>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content>
              <span class="ico"><mat-icon fontSet="material-symbols-outlined">bed</mat-icon></span>
              <div class="value"><span [appCountUp]="s.occupiedBeds"></span> / {{ s.totalBeds }}</div>
              <div class="label">Lits occupés</div>
              <div class="sub">{{ s.freeBeds }} libre(s) · {{ s.totalRooms }} chambres</div>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content>
              <span class="ico"><mat-icon fontSet="material-symbols-outlined">monitoring</mat-icon></span>
              <div class="value"><span [appCountUp]="s.occupancyRate"></span> %</div>
              <div class="label">Taux d'occupation</div>
              <mat-progress-bar mode="determinate" [value]="s.occupancyRate" />
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content>
              <span class="ico"><mat-icon fontSet="material-symbols-outlined">manage_accounts</mat-icon></span>
              <div class="value"><span [appCountUp]="s.enabledUsers"></span></div>
              <div class="label">Comptes actifs</div>
              <div class="sub">{{ s.disabledUsers }} désactivé(s)</div>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="panels">
          <mat-card appearance="outlined">
            <mat-card-header><mat-card-title>Occupation par étage</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (f of s.floors; track f.floor) {
                <div class="floor">
                  <span>Étage {{ f.floor }} · {{ f.rooms }} chambre(s)</span>
                  <span>{{ f.occupied }} / {{ f.beds }} lits</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="percent(f.occupied, f.beds)" />
              } @empty {
                <p class="sub">Aucune chambre.</p>
              }
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined">
            <mat-card-header><mat-card-title>Comptes par rôle</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (r of roles(); track r.label) {
                <div class="floor"><span>{{ r.label }}</span><strong>{{ r.count }}</strong></div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined" class="wide">
            <mat-card-header><mat-card-title>Dernières admissions</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (r of s.recentAdmissions; track r.id) {
                <div class="floor">
                  <a class="link" [routerLink]="['/admin/residents', r.id]">{{ r.lastName }} {{ r.firstName }}</a>
                  <span>
                    {{ r.roomNumber ? 'Chambre ' + r.roomNumber : 'Sans chambre' }} ·
                    {{ r.admissionDate | date: 'dd/MM/yyyy' }}
                  </span>
                </div>
              } @empty {
                <p class="sub">Aucune admission.</p>
              }
            </mat-card-content>
          </mat-card>
        </section>
      }
    </div>
  `,
  styles: `
    .stack { display: flex; flex-direction: column; gap: 16px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .ico { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; margin-bottom: 8px; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .value { font-size: 32px; font-weight: 500; }
    .label { font-weight: 500; }
    .sub { color: var(--mat-sys-on-surface-variant); font-size: 13px; }
    .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .wide { grid-column: 1 / -1; }
    .floor { display: flex; justify-content: space-between; margin: 12px 0 4px; }
    .notice { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); margin: 0; }
    .notice .link { margin-left: auto; color: inherit; font-weight: 500; }
  `,
})
export class AdminDashboard {
  private readonly service = inject(AdminDashboardService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly roles = computed(() => {
    const s = this.stats();
    return s ? ALL_ROLES.map((role) => ({ label: ROLE_LABEL[role], count: s.usersByRole[role] ?? 0 })) : [];
  });

  constructor() {
    this.service.stats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Impossible de charger les statistiques'));
        this.loading.set(false);
      },
    });
  }

  protected percent(value: number, total: number): number {
    return total > 0 ? Math.round((value * 100) / total) : 0;
  }
}
