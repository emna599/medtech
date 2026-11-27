import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorMessage } from '../../shared/utils/api-error';

import { readBraceletCode } from '../../shared/utils/bracelet-link';
import { NfcReader, nfcSupported } from '../personnel/components/nfc-reader';

interface BadgeStatus { assigned: boolean }

@Component({
  selector: 'app-rfid-badge-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, NfcReader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.resource === 'users' ? 'Badge du personnel' : 'Bracelet RFID du résident' }}</h2>
    <mat-dialog-content>
      @if (assigned() !== null) {
        <p role="status">{{ assigned() ? 'Identifiant RFID actif' : 'Aucun identifiant RFID actif' }}</p>
      }
      @if (reading()) {
        <app-nfc-reader (scanned)="fromReader($event)" (failed)="readerError($event)" />
        <button mat-button type="button" (click)="reading.set(false)">Annuler la lecture</button>
      } @else if (canReadNfc) {
        <button mat-stroked-button type="button" [disabled]="busy()" (click)="reading.set(true)">Lire la puce NFC</button>
      }
      <form (ngSubmit)="assign()">
        <mat-form-field appearance="outline">
          <mat-label>Code lu par le lecteur RFID</mat-label>
          <input matInput name="code" [(ngModel)]="code" maxlength="100" autocomplete="off" />
        </mat-form-field>
        <button mat-flat-button [disabled]="busy() || !code.trim()">
          {{ assigned() ? 'Remplacer' : 'Attribuer' }}
        </button>
      </form>
      @if (assigned()) {
        <button mat-stroked-button type="button" [disabled]="busy()" (click)="revoke()">Révoquer</button>
      }
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Fermer</button></mat-dialog-actions>
  `,
  styles: `form { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }`,
})
export class RfidBadgeDialog {
  protected readonly canReadNfc = nfcSupported();
  protected readonly reading = signal(false);

  protected fromReader(code: string): void {
    this.reading.set(false);
    const value = this.data.resource === 'residents'
      ? readBraceletCode(code, window.location.origin, environment.braceletOrigin)
      : code.trim();
    if (!value || value.length > 100) {
      this.error.set('La puce ne contient pas de code MedTech valide.');
      return;
    }
    this.code = value;
    this.error.set('');
  }

  protected readerError(message: string): void {
    this.reading.set(false);
    this.error.set(message);
  }

  protected readonly data = inject<{ resource: 'users' | 'residents'; id: number }>(MAT_DIALOG_DATA);
  private readonly http = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);
  private readonly url = `${environment.apiUrl}/api/admin/${this.data.resource}/${this.data.id}/rfid`;
  protected readonly assigned = signal<boolean | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected code = '';

  constructor() { this.run(this.http.get<BadgeStatus>(this.url)); }

  protected assign(): void {
    if (!this.code.trim()) return;
    this.run(this.http.put<BadgeStatus>(this.url, { code: this.code.trim() }));
  }

  protected revoke(): void { this.run(this.http.delete<BadgeStatus>(this.url)); }

  private run(request: Observable<BadgeStatus>): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    request.pipe(takeUntilDestroyed(this.destroy), finalize(() => this.busy.set(false))).subscribe({
      next: result => { this.assigned.set(result.assigned); this.code = ''; },
      error: err => this.error.set(apiErrorMessage(err, 'Opération RFID indisponible.')),
    });
  }
}
