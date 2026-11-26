import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  protected readonly role = computed(() => this.auth.currentUser()?.role);

  protected backToTop(pageStart: HTMLElement): void {
    pageStart.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
}
