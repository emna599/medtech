import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'medtech.alerts';

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writeEnabled(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // Stockage indisponible : le réglage vaut pour cette session seulement.
  }
}

/**
 * Alertes du planning : à l'heure d'une tâche, une notification du navigateur s'affiche si le soignant les a activées.
 * Elles ne fonctionnent que page ouverte : il n'y a pas de serveur de notification.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly supported = typeof window !== 'undefined' && 'Notification' in window;
  /** Alertes activées par le soignant (et autorisées par le navigateur). */
  readonly enabled = signal(this.supported && readEnabled() && Notification.permission === 'granted');

  /** Active ou désactive les alertes ; la première activation demande l'autorisation au navigateur. */
  async toggle(): Promise<void> {
    if (!this.supported) {
      return;
    }
    if (this.enabled()) {
      this.enabled.set(false);
      writeEnabled(false);
      return;
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    const granted = permission === 'granted';
    this.enabled.set(granted);
    writeEnabled(granted);
  }

  /** Affiche une notification système si les alertes sont activées. */
  show(title: string, body: string): void {
    if (!this.enabled()) {
      return;
    }
    try {
      new Notification(title, { body, icon: 'logo.svg', tag: `medtech-${title}` });
    } catch {
      // Certains navigateurs mobiles exigent un service worker : l'alerte dans la page suffit alors.
    }
  }
}
