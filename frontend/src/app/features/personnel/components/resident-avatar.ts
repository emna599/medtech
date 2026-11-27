import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Photo du résident, ou initiales sur fond coloré si la photo est absente ou illisible. */
@Component({
  imports: [MatIconModule],
  selector: 'app-resident-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (photoUrl() && !failed()) {
      <img
        class="photo"
        [src]="photoUrl()"
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
        [class.with-person]="showPersonIcon()"
        [style.font-size.px]="size() * (showPersonIcon() ? 0.23 : 0.38)"
        [style.background]="background()"
      >
        @if (showPersonIcon()) {
          <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">person</mat-icon>
        }
        {{ initials() }}
      </span>
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
    .with-person {
      flex-direction: column;
      gap: 1px;
      line-height: 1;
    }
    .with-person mat-icon {
      width: 1.55em;
      height: 1.55em;
      font-size: 1.55em;
    }
  `,
})
export class ResidentAvatar {
  readonly photoUrl = input<string | null>(null);
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly size = input(56);
  readonly showPersonIcon = input(false);

  protected readonly failed = signal(false);

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
