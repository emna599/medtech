import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Logo } from '../../../shared/components/logo/logo';
import { ROLE_HOME_ROUTE } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    Logo,
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

  protected readonly form = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

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

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.loading.set(false);
        void this.router.navigateByUrl(ROLE_HOME_ROUTE[response.user.role]);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(this.toMessage(error));
      },
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      }
      if (error.status === 401) {
        return "Nom d'utilisateur ou mot de passe incorrect.";
      }
      if (error.status === 400) {
        return 'Veuillez renseigner le nom d\'utilisateur et le mot de passe.';
      }
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
