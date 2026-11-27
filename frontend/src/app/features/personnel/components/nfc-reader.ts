import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

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
  return readerCtor() !== null;
}

/** Pourquoi le NFC n'est pas disponible sur un téléphone Android (null sinon, ou sur un ordinateur). */
export function nfcProblem(): string | null {
  if (typeof window === 'undefined' || readerCtor() !== null || !/Android/i.test(navigator.userAgent)) {
    return null;
  }
  if (!window.isSecureContext) {
    return 'Page non sécurisée : dans Chrome, ouvrez chrome://flags/#unsafely-treat-insecure-origin-as-secure, ajoutez ' +
      window.location.origin + ', activez puis relancez Chrome.';
  }
  return 'Ce navigateur ne lit pas le NFC : utilisez Chrome sur Android.';
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

/**
 * Écoute le NFC du téléphone pour UNE carte, puis s'arrête (appelé quand on appuie sur « Lire »).
 * Renvoie une fonction qui annule l'écoute. Le NFC n'est donc actif que le temps de la lecture.
 */
export function scanNfcOnce(
  handlers: { tag: (value: string) => void; error: (message: string) => void },
  timeoutMs = 30_000,
): () => void {
  const Reader = readerCtor();
  const abort = new AbortController();
  let finished = false;
  const finish = () => {
    finished = true;
    clearTimeout(timer);
    abort.abort();
  };
  const timer = setTimeout(() => {
    if (!finished) {
      finish();
      handlers.error('Aucune carte détectée. Appuyez sur « Lire » pour réessayer.');
    }
  }, timeoutMs);
  if (!Reader) {
    finish();
    handlers.error("Le NFC n'est pas disponible sur cet appareil (Chrome sur Android, HTTPS ou localhost).");
    return () => undefined;
  }
  const reader = new Reader();
  reader.addEventListener('reading', (event) => {
    const value = tagValue(event as NdefReadingEventLike);
    if (value && !finished) {
      finish();
      handlers.tag(value);
    }
  });
  reader.addEventListener('readingerror', () => {
    if (!finished) {
      handlers.error('Carte illisible : rapprochez-la du dos du téléphone.');
    }
  });
  reader.scan({ signal: abort.signal }).catch((error: unknown) => {
    if (finished) {
      return;
    }
    finish();
    const name = error instanceof DOMException ? error.name : '';
    handlers.error(
      name === 'NotAllowedError'
        ? 'Le NFC est refusé : autorisez-le dans le navigateur.'
        : 'Impossible de démarrer le NFC : activez-le dans les réglages du téléphone.',
    );
  });
  return () => {
    if (!finished) {
      finish();
    }
  };
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

  constructor() {
    afterNextRender(() => void this.start());
    inject(DestroyRef).onDestroy(() => this.abort.abort());
  }

  private async start(): Promise<void> {
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
