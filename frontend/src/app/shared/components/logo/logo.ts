import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const GRID = ['011000110', '111101111', '111111111', '111111111', '011111110', '001111100', '000111000', '000010000'];
const STEP = 26;

interface Cell {
  x: number;
  y: number;
  dark: boolean;
  delay: number;
}

/** Logo MedTech : un cœur fait de pixels (clin d'œil au QR code) avec une croix médicale. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 234 208"
      role="img"
      aria-label="Logo MedTech EHPAD"
      [attr.width]="size()"
      [attr.height]="size() * 0.89"
      [class.beat]="animated()"
      [style.--logo-main]="main()"
      [style.--logo-dark]="dark()"
      [style.--logo-cross]="cross()"
    >
      @for (cell of cells; track $index) {
        <rect
          class="cell"
          [class.dark]="cell.dark"
          [class.animated]="animated()"
          [attr.x]="cell.x"
          [attr.y]="cell.y"
          width="23"
          height="23"
          rx="5"
          [style.animation-delay.ms]="cell.delay"
        />
      }
      <g class="cross">
        <rect x="108" y="42" width="15" height="50" rx="3" />
        <rect x="90" y="59" width="51" height="15" rx="3" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    .cell { fill: var(--logo-main); }
    .cell.dark { fill: var(--logo-dark); }
    .cell.animated { animation: pop 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) both; transform-box: fill-box; transform-origin: center; }
    .cross { fill: var(--logo-cross); }
    svg.beat { animation: beat 2.8s ease-in-out 1.6s infinite; transform-origin: center; }
    @keyframes pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
    @keyframes beat {
      0%, 100% { transform: scale(1); }
      12% { transform: scale(1.07); }
      24% { transform: scale(1); }
      36% { transform: scale(1.05); }
      48% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cell.animated, svg.beat { animation: none; }
    }
  `,
})
export class Logo {
  readonly size = input(40);
  readonly animated = input(false);
  /** « light » : version blanche pour les fonds colorés. */
  readonly tone = input<'color' | 'light'>('color');

  protected readonly main = computed(() => (this.tone() === 'light' ? '#ffffff' : '#0F766E'));
  protected readonly dark = computed(() => (this.tone() === 'light' ? '#CCEFE9' : '#12355B'));
  protected readonly cross = computed(() => (this.tone() === 'light' ? '#0F766E' : '#ffffff'));

  protected readonly cells: Cell[] = GRID.flatMap((row, r) =>
    [...row].flatMap((value, c) =>
      value === '1'
        ? [
            {
              x: c * STEP,
              y: r * STEP,
              dark: (r === 0 && (c === 1 || c === 7)) || (r === 1 && (c === 0 || c === 8)),
              delay: (r + c) * 45,
            },
          ]
        : [],
    ),
  );
}
