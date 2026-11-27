import { Capacitor, registerPlugin } from '@capacitor/core';
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const nativeNfc = registerPlugin<{
  scan(): Promise<{ code: string }>;
  cancel(): Promise<void>;
}>('MedTechNfc');

interface NdefRecordLike {
  recordType: string;
  encoding?: string;
  data?: DataView;
}

interface NdefReadingEventLike extends Event {
  serialNumber?: string;
  message?: { records: NdefRecordLike[] };
}

interface NdefReaderLike extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
}

type NdefReaderCtor = new () => NdefReaderLike;

function readerCtor(): NdefReaderCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as unknown as { NDEFReader?: NdefReaderCtor }).NDEFReader ?? null;
}

/** Le NFC du navigateur (Web NFC) n'existe que sur Chrome pour Android, en HTTPS ou sur localhost. */
export function nfcSupported(): boolean {
  return Capacitor.getPlatform() === 'ios' || readerCtor() !== null;
}

/** Contenu texte d'une puce : premier enregistrement texte ou adresse, sinon son numéro de série. */
export function tagValue(event: NdefReadingEventLike): string | null {
  for (const record of event.message?.records ?? []) {
    if ((record.recordType === 'text' || record.recordType === 'url') && record.data) {
      const text = new TextDecoder(record.encoding ?? 'utf-8').decode(record.data).trim();
      if (text) {
        return text;
      }
    }
  }
  return event.serialNumber?.trim() || null;
}

/** Lecteur de puce NFC : le soignant approche la tablette du bracelet, la lecture est automatique. */
@Component({
  selector: 'app-nfc-reader',
  imports: [MatIconModule],
  template: `
    <div class="pulse" aria-hidden="true">
      <mat-icon fontSet="material-symbols-outlined">nfc</mat-icon>
    </div>
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
      text-align: center;
    }
    .pulse {
      width: 132px;
      height: 132px;
      margin: 8px auto 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: var(--brand-teal, #0f766e);
      animation: pulse 1.8s ease-out infinite;
    }
    .pulse mat-icon {
      width: 72px;
      height: 72px;
      font-size: 72px;
    }
    .status {
      margin: 0;
      font-weight: 700;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgb(15 118 110 / 45%);
      }
      100% {
        box-shadow: 0 0 0 36px rgb(15 118 110 / 0%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pulse {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfcReader {
  readonly scanned = output<string>();
  readonly failed = output<string>();

  protected readonly status = signal('Approchez la tablette de la puce du bracelet.');
  private readonly abort = new AbortController();
  private done = false;
  private nativeScanActive = false;

  constructor() {
    afterNextRender(() => void this.start());
    inject(DestroyRef).onDestroy(() => {
      this.abort.abort();
      if (this.nativeScanActive) void nativeNfc.cancel().catch(() => {});
    });
  }

  private async start(): Promise<void> {
    if (Capacitor.getPlatform() === 'ios') {
      this.status.set('Approchez le haut de l’iPhone du badge ou du bracelet.');
      this.nativeScanActive = true;
      try {
        const { code } = await nativeNfc.scan();
        this.nativeScanActive = false;
        if (!this.abort.signal.aborted) this.scanned.emit(code);
      } catch (error) {
        this.nativeScanActive = false;
        if (!this.abort.signal.aborted) {
          this.failed.emit(error instanceof Error ? error.message : 'Lecture NFC indisponible. Saisissez le code.');
        }
      }
      return;
    }

    const Reader = readerCtor();
    if (!Reader) {
      this.failed.emit("La lecture NFC n'est pas disponible sur cet appareil. Saisissez le code de la puce.");
      return;
    }
    try {
      const reader = new Reader();
      reader.addEventListener('reading', (event) => {
        const value = tagValue(event as NdefReadingEventLike);
        if (value && !this.done) {
          this.done = true;
          this.abort.abort();
          this.scanned.emit(value);
        }
      });
      reader.addEventListener('readingerror', () => {
        this.status.set('Puce illisible. Rapprochez-vous et réessayez.');
      });
      await reader.scan({ signal: this.abort.signal });
    } catch (error) {
      if (this.abort.signal.aborted) {
        return;
      }
      const name = error instanceof DOMException ? error.name : '';
      this.failed.emit(
        name === 'NotAllowedError'
          ? 'Le NFC est refusé. Autorisez-le dans le navigateur ou saisissez le code de la puce.'
          : "Impossible de démarrer le NFC (activez-le dans les réglages). Saisissez le code de la puce.",
      );
    }
  }
}
