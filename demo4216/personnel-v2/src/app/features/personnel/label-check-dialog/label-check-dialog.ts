import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { fullName, ResidentCard } from '../../../shared/models/personnel.model';
import { nfcProblem, nfcSupported, scanNfcOnce } from '../components/nfc-reader';
import { ResidentAvatar } from '../components/resident-avatar';
import { IdentifyResult } from '../identify-dialog/identify-dialog';
import { readLabelText } from './label-ocr';
import { LabelInfo, matchResident } from './label-match';

type Step = 'photo' | 'reading' | 'found' | 'verified';

/**
 * Étiquette de médicament (infirmier) : 1) photo de l'étiquette → la photo du résident s'affiche ;
 * 2) le bracelet NFC du résident confirme que c'est bien la personne devant soi ; 3) on peut donner les médicaments.
 */
@Component({
  selector: 'app-label-check-dialog',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatProgressBarModule, ResidentAvatar],
  templateUrl: './label-check-dialog.html',
  styleUrl: './label-check-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelCheckDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<LabelCheckDialog, IdentifyResult>>(MatDialogRef);

  protected readonly nfcOk = nfcSupported();
  protected readonly nfcHint = nfcProblem();
  protected readonly fullName = fullName;

  protected readonly step = signal<Step>('photo');
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly found = signal<ResidentCard | null>(null);
  protected readonly info = signal<LabelInfo | null>(null);

  /** Vérification par le bracelet. */
  protected readonly scanning = signal(false);
  protected readonly wrongPerson = signal<Pick<ResidentCard, 'id' | 'firstName' | 'lastName'> | null>(null);
  protected readonly unknownCard = signal<string | null>(null);
  protected readonly braceletError = signal<string | null>(null);
  protected readonly code = signal('');
  protected readonly busy = signal(false);

  private residents: ResidentCard[] = [];
  private cancelScan: (() => void) | null = null;

  constructor() {
    this.api.listResidents().subscribe({ next: (list) => (this.residents = list), error: () => undefined });
    inject(DestroyRef).onDestroy(() => this.cancelScan?.());
  }

  /** Photo de l'étiquette : lecture des caractères, puis recherche du résident. */
  protected async onPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.error.set(null);
    this.progress.set(0);
    this.step.set('reading');
    try {
      if (this.residents.length === 0) {
        this.residents = await new Promise<ResidentCard[]>((resolve, reject) =>
          this.api.listResidents().subscribe({ next: resolve, error: reject }),
        );
      }
      const text = await readLabelText(file, (ratio) => this.progress.set(ratio));
      const result = matchResident(text, this.residents);
      this.info.set(result.info);
      if (result.status === 'FOUND') {
        this.found.set(result.resident);
        this.step.set('found');
      } else {
        this.error.set(
          result.status === 'AMBIGUOUS'
            ? 'Plusieurs résidents ressemblent à ce nom. Rapprochez-vous de l’étiquette et réessayez.'
            : 'Étiquette non reconnue. Rapprochez-vous, évitez les reflets et réessayez.',
        );
        this.step.set('photo');
      }
    } catch (err) {
      this.error.set(
        err instanceof Error && /fetch|network|load/i.test(err.message)
          ? 'Le moteur de lecture est indisponible. Rechargez la page et réessayez.'
          : errorMessage(err),
      );
      this.step.set('photo');
    }
  }

  /** « Scanner son bracelet » : le NFC du téléphone n'écoute qu'une carte, puis s'arrête. */
  protected scanBracelet(): void {
    this.resetCheck();
    this.scanning.set(true);
    this.cancelScan = scanNfcOnce({
      tag: (token) => {
        this.scanning.set(false);
        this.check(token);
      },
      error: (message) => {
        this.scanning.set(false);
        this.braceletError.set(message);
      },
    });
  }

  /** Sans NFC (ordinateur) : on saisit le code du bracelet. */
  protected checkCode(): void {
    const code = this.code().trim();
    if (code) {
      this.resetCheck();
      this.check(code);
    }
  }

  private check(token: string): void {
    const expected = this.found();
    if (!expected || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.api.identify(token).subscribe({
      next: (resident) => {
        this.busy.set(false);
        if (resident.id === expected.id) {
          this.step.set('verified');
        } else {
          this.wrongPerson.set(resident);
        }
      },
      error: (err: { status?: number }) => {
        this.busy.set(false);
        if (err?.status === 404) {
          this.unknownCard.set(token);
        } else {
          this.braceletError.set(errorMessage(err));
        }
      },
    });
  }

  /** Démonstration : la carte de cantine n'est pas encore liée à un résident, on la lie à celui de l'étiquette. */
  protected linkCard(): void {
    const token = this.unknownCard();
    const resident = this.found();
    if (!token || !resident || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.api.linkNfc(resident.id, token).subscribe({
      next: () => {
        this.busy.set(false);
        this.unknownCard.set(null);
        this.braceletError.set('Bracelet associé. Scannez-le de nouveau pour vérifier.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.braceletError.set(errorMessage(err));
      },
    });
  }

  private resetCheck(): void {
    this.cancelScan?.();
    this.cancelScan = null;
    this.wrongPerson.set(null);
    this.unknownCard.set(null);
    this.braceletError.set(null);
  }

  /** Repart de zéro : autre étiquette. */
  protected restart(): void {
    this.resetCheck();
    this.scanning.set(false);
    this.found.set(null);
    this.info.set(null);
    this.error.set(null);
    this.code.set('');
    this.step.set('photo');
  }

  protected confirm(): void {
    const resident = this.found();
    if (resident && this.step() === 'verified') {
      this.ref.close({ residentId: resident.id });
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
