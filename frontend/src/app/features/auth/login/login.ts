import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { BRACELET_PATH, braceletCode } from '../../../shared/utils/bracelet-link';
import { ROLE_HOME_ROUTE } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected readonly logoutNotice = this.auth.logoutNotice;

  protected readonly hidePassword = signal(true);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected submit(): void {
    if (this.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials = this.form.getRawValue();
    this.auth.login({ ...credentials, username: credentials.username.trim() }).subscribe({
      next: (response) => {
        this.loading.set(false);
        const code = braceletCode(this.route.snapshot.fragment);
        if (code) {
          void this.router.navigate([BRACELET_PATH], { fragment: code, replaceUrl: true });
        } else {
          void this.router.navigateByUrl(ROLE_HOME_ROUTE[response.user.role]);
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        const message = this.toMessage(error);
        this.errorMessage.set(message);
        if (error instanceof HttpErrorResponse && error.status === 0 &&
            Capacitor.getPlatform() === 'ios') {
          void this.diagnoseIosConnection(message);
        }
      },
    });
  }

  private async diagnoseIosConnection(message: string): Promise<void> {
    let diagnostic: string;
    try {
      const response = await CapacitorHttp.get({
        url: `${environment.apiUrl}/connexion-test`,
        connectTimeout: 5000,
        readTimeout: 5000,
      });
      diagnostic = `Test réseau iOS : le serveur répond (HTTP ${response.status}).`;
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : '';
      diagnostic = detail ? `Test réseau iOS : ${detail}` : 'Le test réseau iOS a échoué.';
    }
    if (this.errorMessage() === message) {
      this.errorMessage.set(`${message} ${diagnostic}`);
    }
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      }
      if (error.status === 401) {
        return "Nom d'utilisateur ou mot de passe incorrect.";
      }
      if (error.status === 429) {
        return 'Trop de tentatives de connexion. Réessayez dans quelques minutes.';
      }
      if (error.status === 400) {
        return 'Veuillez renseigner le nom d\'utilisateur et le mot de passe.';
      }
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
