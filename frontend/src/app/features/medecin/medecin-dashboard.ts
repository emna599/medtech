import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-medecin-dashboard',
  imports: [Toolbar, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar />
    <main class="content">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Espace médecin</mat-card-title>
          <mat-card-subtitle>Dossiers médicaux des résidents</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Consultez la liste des résidents et accédez à leurs fiches médicales.</p>
          <a mat-flat-button routerLink="/medecin/residents">
            <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">groups</mat-icon>
            Consulter les résidents
          </a>
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
