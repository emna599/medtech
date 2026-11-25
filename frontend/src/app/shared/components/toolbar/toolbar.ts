import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_LABEL } from '../../models/auth.model';

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

  protected readonly user = this.auth.currentUser;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });

  protected logout(): void {
    this.auth.logout();
  }
}
