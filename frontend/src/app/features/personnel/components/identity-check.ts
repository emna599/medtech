import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ServiceKind } from '../../../shared/models/personnel.model';
import { IdentifyDialog, IdentifyResult, ScanDialogData } from '../identify-dialog/identify-dialog';

/**
 * Comment s'assurer de qui est la personne : avec un bracelet, on le scanne ; sans bracelet, on lit le nom
 * et on compare le visage à la photo. Aide à la vérification, qui ne bloque pas le service.
 */
@Component({
  selector: 'app-identity-check',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (hasBracelet()) {
      <div class="box" [class.ok]="verified() === 'OK'" [class.bad]="verified() === 'BAD'">
        <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">{{ icon() }}</mat-icon>
        <span class="text">{{ text() }}</span>
        <span class="grow"></span>
        <button mat-stroked-button type="button" (click)="scan()">
          <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">qr_code_scanner</mat-icon>
          Scanner le bracelet
        </button>
      </div>
    } @else {
      <div class="box nobracelet">
        <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">badge</mat-icon>
        <span class="text">
          Pas de bracelet : lisez le nom <strong>{{ residentName() }}</strong> et comparez le visage à la photo.
        </span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
      padding: 10px 14px;
      border-radius: 14px;
      border: 2px solid var(--app-line-soft);
    }
    .grow {
      flex: 1 1 auto;
    }
    .ok {
      border-color: var(--brand-teal, #0f766e);
      background: color-mix(in srgb, var(--brand-teal, #0f766e) 10%, var(--app-surface));
    }
    .bad,
    .nobracelet {
      border-color: var(--app-warn, #b45309);
      background: var(--app-warn-bg, #fff0ec);
    }
    .bad {
      border-color: var(--app-danger, #b3261e);
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityCheck {
  private readonly dialog = inject(MatDialog);

  readonly residentId = input.required<number>();
  readonly residentName = input.required<string>();
  readonly hasBracelet = input(true);
  readonly kind = input<ServiceKind>('REPAS');

  protected readonly verified = signal<'NONE' | 'OK' | 'BAD'>('NONE');

  protected readonly icon = computed(() => {
    switch (this.verified()) {
      case 'OK':
        return 'verified';
      case 'BAD':
        return 'gpp_bad';
      default:
        return 'nfc';
    }
  });

  protected readonly text = computed(() => {
    switch (this.verified()) {
      case 'OK':
        return 'Bracelet scanné : c\'est bien cette personne.';
      case 'BAD':
        return 'Ce bracelet est celui d\'une autre personne. Ne donnez rien : vérifiez qui elle est.';
      default:
        return 'Scannez le bracelet pour confirmer la personne.';
    }
  });

  protected scan(): void {
    const ref = this.dialog.open<IdentifyDialog, ScanDialogData, IdentifyResult>(IdentifyDialog, {
      data: { mode: this.kind() === 'REPAS' ? 'QR' : 'NFC' },
      width: '560px',
      maxWidth: '100vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.verified.set(result.residentId === this.residentId() ? 'OK' : 'BAD');
      }
    });
  }
}
