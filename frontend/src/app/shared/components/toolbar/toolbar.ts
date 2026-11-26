import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_LABEL } from '../../models/auth.model';

/** Barre du haut commune aux trois espaces : nom, rôle de l'utilisateur et déconnexion. */
@Component({
  selector: 'app-toolbar',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  protected readonly dark = computed(() => this.theme.mode() === 'dark');

  protected readonly user = this.auth.currentUser;
  protected readonly homeRoute = computed(() => this.auth.homeRoute());
  protected readonly roleLabel = computed(() => {
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
