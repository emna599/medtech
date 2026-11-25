import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import jsQR from 'jsqr';

const MAX_SIDE = 640;

/** Lit un QR code dans une photo (appareil photo ou galerie). Renvoie null si aucun QR code n'est lisible. */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return null;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    return jsQR(image.data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
  } finally {
    bitmap.close();
  }
}

/**
 * Lecteur de QR code en direct avec la caméra arrière. Nécessite HTTPS ou localhost : sinon
 * (ou si la caméra est refusée), il le dit et le parent propose la photo à la place.
 */
@Component({
  selector: 'app-qr-reader',
  template: `
    <div class="frame">
      <video #video playsinline muted aria-label="Image de la caméra"></video>
      <div class="target" aria-hidden="true"></div>
    </div>
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
    }
    .frame {
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      background: #000;
      aspect-ratio: 4 / 3;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .target {
      position: absolute;
      inset: 18% 22%;
      border: 4px solid rgb(255 255 255 / 85%);
      border-radius: 16px;
      box-shadow: 0 0 0 999px rgb(0 0 0 / 35%);
    }
    .status {
      margin: 8px 0 0;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrReader {
  readonly scanned = output<string>();
  readonly failed = output<string>();

  protected readonly status = signal('Placez le QR code dans le cadre.');
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private frame = 0;
  private stopped = false;

  constructor() {
    afterNextRender(() => void this.start());
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.failed.emit("La caméra n'est pas disponible ici (il faut une connexion sécurisée). Prenez plutôt une photo du QR code.");
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (this.stopped) {
        this.stop();
        return;
      }
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.loop();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      this.failed.emit(
        name === 'NotAllowedError'
          ? 'La caméra est bloquée. Autorisez-la dans le navigateur ou prenez une photo du QR code.'
          : name === 'NotFoundError'
            ? "Aucune caméra trouvée. Prenez plutôt une photo du QR code."
            : "Impossible de démarrer la caméra. Prenez plutôt une photo du QR code.",
      );
    }
  }

  private loop(): void {
    const video = this.video().nativeElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const tick = () => {
      if (this.stopped || !context) {
        return;
      }
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          this.stop();
          this.scanned.emit(code.data);
          return;
        }
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stop(): void {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
