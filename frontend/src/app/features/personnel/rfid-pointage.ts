import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { NfcReader, nfcSupported } from './components/nfc-reader';

@Component({
  selector: 'app-rfid-pointage',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, NfcReader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Pointage RFID</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>Code de votre badge</mat-label>
        <input matInput type="password" [(ngModel)]="code" maxlength="100" autocomplete="off" />
      </mat-form-field>
      @if (scanning()) {
        <app-nfc-reader (scanned)="read($event)" (failed)="readError($event)" />
        <button mat-button type="button" (click)="scanning.set(false)">Annuler la lecture NFC</button>
      } @else if (canReadNfc) {
        <button mat-button type="button" (click)="scanning.set(true)" [disabled]="busy()">Lire le badge NFC</button>
      }
      <div class="actions">
        <button mat-flat-button type="button" [disabled]="busy() || !code.trim()" (click)="point(false)">Pointer l’arrivée</button>
        <button mat-stroked-button type="button" [disabled]="busy() || !code.trim()" (click)="point(true)">Pointer le départ</button>
      </div>
      @if (message()) { <p role="status">{{ message() }}</p> }
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Fermer</button></mat-dialog-actions>
  `,
  styles: `.actions { display: flex; flex-wrap: wrap; gap: 8px; }`,
})
export class RfidPointage {
  private readonly http = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);
  protected readonly canReadNfc = nfcSupported();
  protected readonly scanning = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected code = '';

  protected read(code: string): void { this.code = code; this.scanning.set(false); }
  protected readError(error: string): void { this.error.set(error); this.scanning.set(false); }

  protected point(leaving: boolean): void {
    if (this.busy() || !this.code.trim()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http.post<{ present: boolean }>(`${environment.apiUrl}/api/personnel/team/rfid`, {
      code: this.code.trim(), leaving,
    }).pipe(takeUntilDestroyed(this.destroy), finalize(() => this.busy.set(false))).subscribe({
      next: state => {
        this.code = '';
        this.message.set(state.present ? 'Présence enregistrée.' : 'Départ enregistré.');
      },
      error: err => this.error.set(apiErrorMessage(err, 'Pointage refusé.')),
    });
  }
}
