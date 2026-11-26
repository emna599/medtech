import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-admin-shell',
  imports: [Toolbar, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar />
    <div class="work-page">
      <nav class="admin-nav" aria-label="Administration">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            ariaCurrentWhenActive="page"
          >{{ item.label }}</a>
        }
      </nav>
      <main><router-outlet /></main>
    </div>
  `,
  styles: `
    .admin-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .admin-nav a {
      padding: 10px 12px;
      border-radius: 6px;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
      font: var(--mat-sys-label-large);
    }
    .admin-nav a:hover { background: var(--mat-sys-surface-container-high); }
    .admin-nav a.active {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
  `,
})
export class AdminShell {
  protected readonly items = [
    { label: 'Tableau de bord', path: '/admin', exact: true },
    { label: 'Résidents', path: '/admin/residents', exact: false },
    { label: 'Chambres et étages', path: '/admin/rooms', exact: false },
    { label: 'Comptes', path: '/admin/users', exact: false },
  ];
}
