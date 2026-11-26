import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { fullName, ResidentIdentity } from '../../../shared/models/personnel.model';
import { decodeQrFromFile, QrReader } from '../components/qr-reader';
import { readBraceletCode } from '../../../shared/utils/bracelet-link';
import { ResidentAvatar } from '../components/resident-avatar';

export interface IdentifyDialogData {
  mode: 'admin' | 'medecin' | 'personnel';
  initialCode?: string | null;
}

export interface IdentifyResult {
  residentId: number;
}

/**
 * « Je ne le connais pas » : le soignant saisit ou scanne (lecteur de type clavier) le code anonyme
 * d'un bracelet ou d'un badge facultatif. La fiche s'affiche, et c'est à lui de comparer le visage à la photo.
 */
@Component({
  selector: 'app-identify-dialog',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, QrReader, ResidentAvatar],
  templateUrl: './identify-dialog.html',
  styleUrl: './identify-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentifyDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<IdentifyDialog, IdentifyResult>>(MatDialogRef);

  private readonly data = inject<IdentifyDialogData>(MAT_DIALOG_DATA, { optional: true });
  protected readonly mode = this.data?.mode ?? 'personnel';

  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly found = signal<ResidentIdentity | null>(null);
  protected readonly rejected = signal(false);
  /** Caméra de lecture du QR code ouverte. */
  protected readonly scanning = signal(false);
  protected readonly cameraError = signal<string | null>(null);
  /** Ce qui a été lu sur l'étiquette d'une pochette, affiché à côté de la photo pour vérification. */
  protected readonly labelInfo = signal<string | null>(null);

  protected readonly foundName = computed(() => {
    const resident = this.found();
    return resident ? fullName(resident) : '';
  });

  constructor() {
    if (this.data?.initialCode) {
      this.code.set(this.data.initialCode);
      this.identify();
    }
  }

  protected identify(): void {
    const code = readBraceletCode(this.code(), window.location.origin);
    if (!code && this.code().trim()) {
      this.error.set('Ce QR code ne correspond pas à un bracelet MedTech de cet établissement.');
      return;
    }
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

  protected startScan(): void {
    this.error.set(null);
    this.cameraError.set(null);
    this.rejected.set(false);
    this.scanning.set(true);
  }

  protected stopScan(): void {
    this.scanning.set(false);
  }

  protected onQr(text: string): void {
    if (this.busy()) return;
    this.scanning.set(false);
    this.code.set(text);
    this.identify();
  }

  protected onCameraError(message: string): void {
    this.cameraError.set(message);
  }

  /** Photo d'un QR code (si la caméra en direct n'est pas disponible) : on le lit puis on cherche le résident. */
  protected qrPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) {
      return;
    }
    this.error.set(null);
    this.rejected.set(false);
    this.busy.set(true);
    decodeQrFromFile(file).then(
      (text) => {
        this.busy.set(false);
        if (text) {
          this.scanning.set(false);
          this.code.set(text);
          this.identify();
        } else {
          this.error.set('Aucun QR code lisible sur cette photo. Rapprochez-vous et réessayez.');
        }
      },
      () => {
        this.busy.set(false);
        this.error.set("Cette image n'a pas pu être lue.");
      },
    );
  }

  /** Photo de l'étiquette d'une pochette : le service OCR propose un résident, on vérifie ensuite le visage. */
  protected scanPochette(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.rejected.set(false);
    this.api.scanPochette(file).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result.status === 'FOUND' && result.resident) {
          const parts = [result.nameRead, result.prise, result.date].filter((p): p is string => !!p);
          this.labelInfo.set(`Lu sur l'étiquette : ${parts.join(' · ')}`);
          this.found.set(result.resident);
        } else {
          this.error.set(result.message);
        }
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
    this.labelInfo.set(null);
    this.code.set('');
  }

  protected close(): void {
    this.ref.close();
  }
}
