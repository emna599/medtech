import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const KEY = 'medtech-theme';

/**
 * Mode clair / sombre. Le choix est mémorisé dans ce navigateur ; sans choix, le réglage du système est suivi.
 * Le thème initial est posé par un petit script dans index.html, pour éviter un flash blanc au chargement.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');

  readonly projection = signal(this.restoreProjection());

  private restoreProjection(): boolean {
    try {
      const enabled = sessionStorage.getItem('medtech-projection') === 'true';
      if (enabled) document.documentElement.dataset['projection'] = 'true';
      return enabled;
    } catch {
      return false;
    }
  }

  toggleProjection(): void {
    const enabled = !this.projection();
    this.projection.set(enabled);
    document.documentElement.dataset['projection'] = String(enabled);
    try {
      sessionStorage.setItem('medtech-projection', String(enabled));
    } catch {
      // Le réglage reste utilisable sur la page courante.
    }
  }

  toggle(): void {
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    document.documentElement.dataset['theme'] = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // stockage indisponible (navigation privée...) : le choix vaut pour cette page seulement
    }
  }
}
