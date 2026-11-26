import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { errorMessage } from '../../../core/services/personnel.service';
import { ResidentAvatar } from '../../../features/personnel/components/resident-avatar';

@Component({
  selector: 'app-resident-portrait',
  standalone: true,
  imports: [MatButtonModule, ResidentAvatar],
  template: `
    @if (photoUrl(); as url) {
      <img [src]="url" [width]="size()" [height]="size()" alt="Portrait du résident" />
    } @else {
      <app-resident-avatar [photoUrl]="fallback()" [firstName]="firstName()" [lastName]="lastName()" [size]="size()" />
    }
    @if (mayManage()) {
      <div class="photo-controls">
        <input #file type="file" accept="image/jpeg,image/png" hidden (change)="selectFile(file)" />
        <button mat-stroked-button type="button" [disabled]="busy()" (click)="file.click()">
          {{ photoUrl() ? 'Remplacer la photo' : 'Ajouter une photo' }}
        </button>
        @if (photoUrl() && !confirmRemove()) {
          <button mat-button type="button" [disabled]="busy()" (click)="confirmRemove.set(true)">Retirer la photo</button>
        }
        @if (confirmRemove()) {
          <button mat-button type="button" [disabled]="busy()" (click)="remove()">Confirmer le retrait</button>
          <button mat-button type="button" [disabled]="busy()" (click)="confirmRemove.set(false)">Annuler</button>
        }
      </div>
      @if (error(); as message) { <p role="alert">{{ message }}</p> }
      @if (status(); as message) { <p role="status">{{ message }}</p> }
    }
  `,
  styles: `
    :host { display: grid; gap: 8px; justify-items: start; min-width: 0; }
    img { object-fit: cover; border-radius: var(--app-radius); max-width: 100%; }
    .photo-controls { display: flex; flex-wrap: wrap; gap: 4px; }
    p { margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentPortrait {
  readonly residentId = input.required<number>();
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly fallback = input<string | null>(null);
  readonly size = input(88);
  readonly manage = input(false);

  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  protected readonly mayManage = computed(() => this.manage() && this.auth.currentUser()?.role === 'ADMIN');
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly confirmRemove = signal(false);

  private readonly photo = rxResource({
    params: () => this.residentId(),
    stream: ({ params }) => this.http.get(`${environment.apiUrl}/api/resident-photos/${params}`, { responseType: 'blob' }),
  });

  constructor() {
    effect(onCleanup => {
      const blob = this.photo.hasValue() ? this.photo.value() : null;
      const url = blob?.size ? URL.createObjectURL(blob) : null;
      this.photoUrl.set(url);
      if (url) onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  protected selectFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.mayManage() || this.busy()) return;
    if (file.size > 1_000_000) {
      this.error.set('Choisissez une image JPEG ou PNG de 1 Mo maximum.');
      return;
    }
    const form = new FormData();
    form.append('photo', file);
    this.save(form);
  }

  protected remove(): void {
    if (this.mayManage() && !this.busy()) this.save(null);
  }

  private save(form: FormData | null): void {
    const residentId = this.residentId();
    const url = `${environment.apiUrl}/api/admin/residents/${residentId}/photo`;
    this.busy.set(true);
    this.error.set(null);
    this.status.set(null);
    const request = form ? this.http.put<void>(url, form) : this.http.delete<void>(url);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        if (residentId !== this.residentId()) return;
        this.confirmRemove.set(false);
        this.photo.reload();
        this.status.set(form ? 'Photo enregistrée.' : 'Photo retirée.');
      },
      error: error => {
        this.busy.set(false);
        if (residentId === this.residentId()) this.error.set(errorMessage(error));
      },
    });
  }
}
