import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-medecin-dashboard',
  imports: [Toolbar, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar />
    <main class="content">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Espace médecin</mat-card-title>
          <mat-card-subtitle>Fiches médicales et QR codes des résidents</mat-card-subtitle>
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
export class MedecinDashboard {}
