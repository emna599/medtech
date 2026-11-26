import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IdentifyDialog, IdentifyDialogData, IdentifyResult } from '../personnel/identify-dialog/identify-dialog';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-admin-shell',
  imports: [Toolbar, MatButtonModule, RouterOutlet, RouterLink, RouterLinkActive],
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
        <button mat-stroked-button type="button" (click)="openIdentify()">Identifier un résident</button>
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
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected openIdentify(): void {
    this.dialog.open<IdentifyDialog, IdentifyDialogData, IdentifyResult>(IdentifyDialog, {
      width: '560px',
      maxWidth: '100vw',
      data: { mode: 'admin' },
    }).afterClosed().subscribe((result) => {
      if (result) void this.router.navigate(['/admin/residents', result.residentId]);
    });
  }

  protected readonly items = [
    { label: 'Tableau de bord', path: '/admin', exact: true },
    { label: 'Résidents', path: '/admin/residents', exact: false },
    { label: 'Chambres et étages', path: '/admin/rooms', exact: false },
    { label: 'Comptes', path: '/admin/users', exact: false },
  ];
}
