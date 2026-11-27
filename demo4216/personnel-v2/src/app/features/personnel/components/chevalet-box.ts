import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { Chevalet } from '../../../shared/models/personnel.model';

/** Chevalet du résident : voir son numéro, l'associer à un numéro de chevalet, ou le retirer. */
@Component({
  selector: 'app-chevalet-box',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="box">
      <div class="line">
        <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">table_restaurant</mat-icon>
        @if (chevalet(); as c) {
          <span class="text"><strong>{{ c.code }}</strong></span>
        } @else {
          <span class="text">—</span>
        }
        <span class="grow"></span>
        @if (!editing()) {
          <button mat-stroked-button type="button" [disabled]="busy()" (click)="edit()">
            <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">{{ chevalet() ? 'edit' : 'add_link' }}</mat-icon>
            {{ chevalet() ? '' : 'Associer' }}
          </button>
          @if (chevalet()) {
            <button mat-button type="button" [disabled]="busy()" aria-label="Retirer le chevalet" (click)="release()">
              <mat-icon fontSet="material-symbols-outlined" aria-hidden="true">link_off</mat-icon>
            </button>
          }
        }
      </div>

      @if (editing()) {
        <div class="form">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>N°</mat-label>
            <input
              matInput
              autocomplete="off"
              maxlength="30"
              [ngModel]="code()"
              (ngModelChange)="code.set($event)"
              (keydown.enter)="associate(false)"
            />
          </mat-form-field>
          <button mat-flat-button type="button" [disabled]="busy() || !code().trim()" (click)="associate(false)">
            Associer
          </button>
          <button mat-button type="button" (click)="cancel()">Annuler</button>
        </div>
      }

      @if (conflict(); as message) {
        <p class="conflict" role="alert">
          {{ message }}
          <button mat-flat-button type="button" [disabled]="busy()" (click)="associate(true)">Réassigner</button>
        </p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .box {
      padding: 10px 14px;
      border-radius: 14px;
      border: 2px solid var(--app-line-soft);
    }
    .line,
    .form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .form {
      margin-top: 8px;
    }
    .grow {
      flex: 1 1 auto;
    }
    .line mat-icon {
      color: var(--brand-teal, #0f766e);
    }
    .error,
    .conflict {
      margin: 8px 0 0;
      color: var(--app-danger, #b3261e);
      font-weight: 700;
    }
    .conflict button {
      margin-left: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChevaletBox {
  private readonly api = inject(PersonnelService);

  readonly residentId = input.required<number>();

  protected readonly chevalet = signal<Chevalet | null>(null);
  protected readonly editing = signal(false);
  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Le chevalet saisi appartient déjà à quelqu'un d'autre : message à confirmer. */
  protected readonly conflict = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.residentId();
      untracked(() => this.load(id));
    });
  }

  private load(id: number): void {
    this.api.chevalet(id).subscribe({
      next: (chevalet) => this.chevalet.set(chevalet ?? null),
      error: () => this.chevalet.set(null),
    });
  }

  protected edit(): void {
    this.code.set(this.chevalet()?.code ?? '');
    this.error.set(null);
    this.conflict.set(null);
    this.editing.set(true);
  }

  protected cancel(): void {
    this.editing.set(false);
    this.error.set(null);
    this.conflict.set(null);
  }

  protected associate(replace: boolean): void {
    const code = this.code().trim();
    if (!code || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.associateChevalet(code, this.residentId(), replace).subscribe({
      next: (chevalet) => {
        this.chevalet.set(chevalet);
        this.editing.set(false);
        this.conflict.set(null);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.conflict.set(errorMessage(err));
        } else {
          this.conflict.set(null);
          this.error.set(errorMessage(err));
        }
      },
    });
  }

  protected release(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.releaseChevalet(this.residentId()).subscribe({
      next: () => {
        this.chevalet.set(null);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
