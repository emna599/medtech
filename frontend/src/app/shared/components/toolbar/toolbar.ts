import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_LABEL } from '../../models/auth.model';
import { Job, JOB_LABEL } from '../../models/personnel.model';

/** Barre du haut commune aux trois espaces : nom, rôle de l'utilisateur et déconnexion. */
@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  protected readonly dark = computed(() => this.theme.mode() === 'dark');

  /** Fonction du soignant (infirmier / aide-soignant), donnée par l'espace personnel : elle remplace « Personnel ». */
  readonly job = input<Job | null>(null);

  protected readonly user = this.auth.currentUser;
  protected readonly roleLabel = computed(() => {
    const job = this.job();
    if (job) {
      return JOB_LABEL[job];
    }
    const role = this.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected logout(): void {
    this.auth.logout();
  }
}
