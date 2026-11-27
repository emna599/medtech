import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, signal, untracked } from '@angular/core';
import { PhotoService } from '../../../core/services/photo.service';

/** Photo du résident, ou initiales sur fond coloré si la photo est absente ou illisible. */
@Component({
  selector: 'app-resident-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !failed()) {
      <img
        class="photo"
        [src]="src()"
        [alt]="'Photo de ' + firstName() + ' ' + lastName()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        (error)="failed.set(true)"
      />
    } @else {
      <span
        class="initials"
        role="img"
        [attr.aria-label]="'Initiales de ' + firstName() + ' ' + lastName()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="size() * 0.38"
        [style.background]="background()"
        >{{ initials() }}</span
      >
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .photo {
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }
    .initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      font-weight: 500;
      letter-spacing: 0.02em;
      user-select: none;
    }
  `,
})
export class ResidentAvatar {
  readonly photoUrl = input<string | null>(null);
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly size = input(56);

  protected readonly failed = signal(false);
  /** Adresse réellement affichée : directe, ou locale pour les photos protégées par la connexion (/api/...). */
  protected readonly src = signal<string | null>(null);

  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const url = this.photoUrl();
      untracked(() => {
        this.failed.set(false);
        if (!url) {
          this.src.set(null);
        } else if (url.startsWith('/api/')) {
          this.src.set(null);
          this.injector.get(PhotoService).objectUrl(url).subscribe({
            next: (local) => this.src.set(local),
            error: () => this.failed.set(true),
          });
        } else {
          this.src.set(url);
        }
      });
    });
  }

  protected readonly initials = computed(
    () => `${this.firstName().charAt(0)}${this.lastName().charAt(0)}`.toUpperCase(),
  );

  /** Couleur stable pour un même résident (calculée à partir du nom). */
  protected readonly background = computed(() => {
    const text = `${this.firstName()}${this.lastName()}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) % 360;
    }
    return `hsl(${hash} 45% 38%)`;
  });
}
