import { Directive, ElementRef, effect, inject, input } from '@angular/core';

/** Fait défiler un nombre de 0 jusqu'à sa valeur (désactivé si l'utilisateur réduit les animations). */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly appCountUp = input.required<number>();
  private frame = 0;

  constructor() {
    effect((onCleanup) => {
      const target = this.appCountUp();
      const el = this.element.nativeElement;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !Number.isFinite(target)) {
        el.textContent = String(target);
        return;
      }
      const duration = 900;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) {
          this.frame = requestAnimationFrame(tick);
        }
      };
      this.frame = requestAnimationFrame(tick);
      onCleanup(() => cancelAnimationFrame(this.frame));
    });
  }
}
