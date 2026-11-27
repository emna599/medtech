import { Component, inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

@Component({
  template: `
    <main class="work-page">
      <h1>Profil indisponible</h1>
      <p>Cette démo propose les espaces aide-soignant, infirmier et service en salle.</p>
      <button type="button" (click)="auth.logout()">Changer de compte</button>
    </main>
  `,
})
export class PreviewProfileUnavailable {
  protected readonly auth = inject(AuthService);
}
