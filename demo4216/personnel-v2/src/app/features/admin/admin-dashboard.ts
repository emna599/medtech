import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-admin-dashboard',
  imports: [Toolbar, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar />
    <main class="content">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Tableau de bord administrateur</mat-card-title>
          <mat-card-subtitle>Comptes, résidents, chambres et statistiques</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Vous êtes connecté. Les fonctionnalités de cet espace seront ajoutées progressivement.</p>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    .content {
      max-width: 960px;
      margin: 24px auto;
      padding: 0 16px;
    }
  `,
})
export class AdminDashboard {}
