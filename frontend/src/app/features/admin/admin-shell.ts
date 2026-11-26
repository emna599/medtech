import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Logo } from '../../shared/components/logo/logo';
import { ROLE_LABEL } from '../../shared/models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  exact: boolean;
}

/** Cadre de l'interface admin : menu latéral, en-tête et zone de contenu. */
@Component({
  selector: 'app-admin-shell',
  imports: [Logo, RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        class="sidenav"
        [mode]="mobile() ? 'over' : 'side'"
        [opened]="!mobile() || menuOpen()"
        (closedStart)="menuOpen.set(false)"
      >
        <div class="brand">
          <app-logo [size]="44" [animated]="true" />
          <div>
            <div class="brand-name">MedTech EHPAD</div>
            <div class="brand-sub">Espace administrateur</div>
          </div>
        </div>
        <nav class="nav">
          @for (item of items; track item.path) {
            <a
              class="nav-item"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              (click)="menuOpen.set(false)"
            >
              <mat-icon fontSet="material-symbols-outlined">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="main">
        <header class="topbar">
          @if (mobile()) {
            <button mat-icon-button type="button" aria-label="Ouvrir le menu" (click)="menuOpen.set(true)">
              <mat-icon fontSet="material-symbols-outlined">menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          @if (user(); as u) {
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="who">
              <span class="who-name">{{ u.fullName }}</span>
              <span class="who-role">{{ roleLabel() }}</span>
            </span>
          }
          <button mat-button type="button" (click)="logout()">
            <mat-icon fontSet="material-symbols-outlined">logout</mat-icon>
            <span class="logout-text">Déconnexion</span>
          </button>
        </header>
        <main class="page">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100vh; background: transparent; }
    .sidenav { width: 250px; border-right: 1px solid var(--mat-sys-outline-variant); }
    .brand { display: flex; align-items: center; gap: 12px; padding: 20px 16px 12px; }
    .brand-name { font: var(--mat-sys-title-medium); }
    .brand-sub { font: var(--mat-sys-label-small); color: var(--mat-sys-on-surface-variant); }
    .nav { display: flex; flex-direction: column; gap: 4px; padding: 12px; }
    .nav-item { transition: background-color 0.2s, transform 0.2s; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 28px; text-decoration: none; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-large); }
    .nav-item:hover { background: var(--mat-sys-surface-container-high); transform: translateX(3px); }
    .nav-item.active { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
    .main { display: flex; flex-direction: column; }
    .topbar { display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 24px; background: var(--mat-sys-surface); border-bottom: 1px solid var(--mat-sys-outline-variant); position: sticky; top: 0; z-index: 2; }
    .spacer { flex: 1 1 auto; }
    .avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); font: var(--mat-sys-label-large); }
    .who { display: flex; flex-direction: column; line-height: 1.2; }
    .who-name { font: var(--mat-sys-label-large); }
    .who-role { font: var(--mat-sys-label-small); color: var(--mat-sys-on-surface-variant); }
    .page { max-width: 1100px; width: 100%; box-sizing: border-box; margin: 0 auto; padding: 24px; }
    @media (max-width: 800px) {
      .topbar { padding: 0 12px; }
      .page { padding: 16px; }
      .who, .logout-text { display: none; }
    }
  `,
})
export class AdminShell {
  private readonly auth = inject(AuthService);

  protected readonly items: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', path: '/admin', exact: true },
    { label: 'Résidents', icon: 'elderly', path: '/admin/residents', exact: false },
    { label: 'Chambres et étages', icon: 'bed', path: '/admin/rooms', exact: false },
    { label: 'Comptes', icon: 'manage_accounts', path: '/admin/users', exact: false },
  ];

  protected readonly mobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 800px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly menuOpen = signal(false);
  protected readonly user = this.auth.currentUser;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });
  protected readonly initials = computed(() =>
    (this.user()?.fullName ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );

  protected logout(): void {
    this.auth.logout();
  }
}
