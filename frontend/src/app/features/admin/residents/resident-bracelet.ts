import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QrCode } from '../../../shared/models/resident.model';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { BRACELET_PATH, braceletCode } from '../../../shared/utils/bracelet-link';
import { createQrSvgDataUrl } from '../../../shared/utils/qr-code';
import { AdminResidentService } from './admin-resident.service';

@Component({
  selector: 'app-resident-bracelet',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './resident-bracelet.html',
  styleUrl: './resident-bracelet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentBracelet {
  readonly residentId = input.required<number>();
  readonly active = input.required<boolean>();
  private readonly residentService = inject(AdminResidentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly qrCodes = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findQrCodesByResidentId(params),
    defaultValue: [],
  });

  protected readonly qrCodeError = computed(() => {
    const error = this.qrCodes.error();
    return error ? apiErrorMessage(error, 'Impossible de charger les codes QR.') : null;
  });

  protected readonly qrCodeSaving = signal(false);
  protected readonly activeQrCode = computed(
    () => (this.qrCodes.hasValue() ? this.qrCodes.value() : []).find((qrCode) => qrCode.active) ?? null,
  );
  protected readonly latestQrCode = computed(() =>
    (this.qrCodes.hasValue() ? this.qrCodes.value() : []).reduce<QrCode | null>(
      (latest, qrCode) =>
        latest === null || qrCode.createdAt > latest.createdAt ? qrCode : latest,
      null,
    ),
  );
  protected readonly visibleQrCodeId = signal<number | null>(null);
  protected readonly qrImageDataUrl = computed(() => {
    const qrCode = this.activeQrCode();
    if (!qrCode?.token) return null;
    try {
      const code = braceletCode(qrCode.token);
      const link = code ? window.location.origin + BRACELET_PATH + '#' + code : null;
      return createQrSvgDataUrl(link && new TextEncoder().encode(link).length <= 78 ? link : qrCode.token);
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
  });

  protected generateQrCode(): void {
    if (!this.active() || this.qrCodeSaving()) {
      return;
    }

    const currentQrCode = this.activeQrCode();
    if (
      currentQrCode &&
      !window.confirm('Le code QR actif sera désactivé et remplacé. Continuer ?')
    ) {
      return;
    }

    const residentId = this.residentId();

    this.visibleQrCodeId.set(null);
    this.qrCodeSaving.set(true);
    this.residentService.generateQrCode(residentId, currentQrCode?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.snackBar.open(currentQrCode ? 'QR code renouvelé.' : 'QR code généré.', 'Fermer', { duration: 3000 });
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.snackBar.open(apiErrorMessage(error, 'Impossible de générer le code QR.'), 'Fermer');
      },
    });
  }

  protected deactivateQrCode(): void {
    const currentQrCode = this.activeQrCode();
    if (!currentQrCode || this.qrCodeSaving()) {
      return;
    }
    if (!window.confirm('Désactiver ce code QR ?')) {
      return;
    }

    const residentId = this.residentId();

    this.visibleQrCodeId.set(null);
    this.qrCodeSaving.set(true);
    this.residentService.deactivateQrCode(residentId, currentQrCode.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.snackBar.open('QR code désactivé.', 'Fermer', { duration: 3000 });
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.snackBar.open(apiErrorMessage(error, 'Impossible de désactiver le code QR.'), 'Fermer');
      },
    });
  }

  protected downloadQrCode(): void {
    const currentQrCode = this.activeQrCode();
    const imageDataUrl = this.qrImageDataUrl();
    if (!currentQrCode || !imageDataUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `qr-code-resident-${currentQrCode.residentId}.svg`;
    link.click();
  }

  protected printQrCode(): void {
    if (this.visibleQrCodeId() === this.activeQrCode()?.id && this.qrImageDataUrl()) {
      document.body.classList.add('print-resident-bracelet');
      try {
        window.print();
      } finally {
        document.body.classList.remove('print-resident-bracelet');
      }
    }
  }

}
