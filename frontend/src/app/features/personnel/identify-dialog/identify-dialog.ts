import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { fullName, ResidentCard } from '../../../shared/models/personnel.model';
import { ResidentAvatar } from '../components/resident-avatar';

export interface IdentifyResult {
  residentId: number;
}

/**
 * « Je ne le connais pas » : le soignant saisit ou scanne (lecteur de type clavier) le code anonyme
 * d'un bracelet ou d'un badge facultatif. La fiche s'affiche, et c'est à lui de comparer le visage à la photo.
 */
@Component({
  selector: 'app-identify-dialog',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, ResidentAvatar],
  templateUrl: './identify-dialog.html',
  styleUrl: './identify-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentifyDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<IdentifyDialog, IdentifyResult>>(MatDialogRef);

  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly found = signal<ResidentCard | null>(null);
  protected readonly rejected = signal(false);

  protected readonly foundName = computed(() => {
    const resident = this.found();
    return resident ? fullName(resident) : '';
  });

  protected identify(): void {
    const code = this.code().trim();
    if (!code || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.identify(code).subscribe({
      next: (resident) => {
        this.busy.set(false);
        this.found.set(resident);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  protected confirm(): void {
    const resident = this.found();
    if (resident) {
      this.ref.close({ residentId: resident.id });
    }
  }

  /** « Ce n'est pas cette personne » : on repart de zéro, et on rappelle la règle de sécurité. */
  protected reject(): void {
    this.rejected.set(true);
    this.found.set(null);
    this.code.set('');
  }

  protected close(): void {
    this.ref.close();
  }
}
