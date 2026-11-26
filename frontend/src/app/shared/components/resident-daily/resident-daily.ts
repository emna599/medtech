import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { errorMessage } from '../../../core/services/personnel.service';
import { createRequestId } from '../../utils/request-id';

interface Preferences {
  text: string;
  version: number;
}

interface DailySummary {
  preferences: Preferences;
  history: {
    id: number;
    author: string;
    recordedAt: string;
    weightKg: number | null;
    observation: string | null;
  }[];
}

@Component({
  selector: 'app-resident-daily',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './resident-daily.html',
  styleUrl: './resident-daily.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentDaily {
  readonly residentId = input.required<number>();
  readonly editable = input(false);

  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forms = inject(FormBuilder);
  private requestId: string | null = null;
  private version = 0;
  protected readonly weightFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

  protected readonly summary = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.http.get<DailySummary>(this.url(params)).pipe(timeout(10_000)),
  });
  protected readonly busy = signal(false);
  protected readonly editing = signal<'preferences' | 'entry' | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly preferences = this.forms.nonNullable.control('', Validators.maxLength(600));
  protected readonly entry = this.forms.group({
    weightKg: this.forms.control<number | null>(null, [Validators.min(0.01), Validators.max(999.99)]),
    observation: this.forms.nonNullable.control('', Validators.maxLength(1000)),
  });

  constructor() {
    effect(() => {
      this.residentId();
      this.editing.set(null);
      this.busy.set(false);
      this.formError.set(null);
      this.notice.set(null);
      this.requestId = null;
    });
  }

  protected editPreferences(current: Preferences): void {
    if (this.busy()) return;
    this.preferences.reset(current.text);
    this.version = current.version;
    this.begin('preferences');
  }

  protected newEntry(): void {
    if (this.busy()) return;
    this.entry.reset({ weightKg: null, observation: '' });
    this.requestId = createRequestId();
    this.begin('entry');
  }

  protected cancel(): void {
    if (this.busy()) return;
    this.editing.set(null);
    this.formError.set(null);
  }

  protected savePreferences(): void {
    if (this.busy() || this.preferences.invalid) return;
    const id = this.residentId();
    this.submit(id, this.http.put<Preferences>(this.url(id) + '/preferences', {
      preferences: this.preferences.value.trim(),
      version: this.version,
    }));
  }

  protected saveEntry(): void {
    if (this.busy() || this.entry.invalid) return;
    const { weightKg, observation } = this.entry.getRawValue();
    if ((weightKg === null && !observation.trim())
        || (weightKg !== null && Number(weightKg.toFixed(2)) !== weightKg)) {
      this.formError.set('Saisissez une observation ou un poids avec deux décimales au maximum.');
      return;
    }
    const id = this.residentId();
    this.submit(id, this.http.post<unknown>(this.url(id) + '/observations', {
      requestId: this.requestId,
      weightKg,
      observation: observation.trim() || null,
    }));
  }

  private begin(editor: 'preferences' | 'entry'): void {
    this.formError.set(null);
    this.notice.set(null);
    this.editing.set(editor);
  }

  private submit(id: number, request: Observable<unknown>): void {
    this.busy.set(true);
    this.formError.set(null);
    request.pipe(timeout(10_000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (id !== this.residentId()) return;
        this.busy.set(false);
        this.editing.set(null);
        this.notice.set('Suivi enregistré.');
        this.summary.reload();
      },
      error: error => {
        if (id !== this.residentId()) return;
        this.busy.set(false);
        this.formError.set(errorMessage(error));
        if (error instanceof HttpErrorResponse && error.status === 409) this.summary.reload();
      },
    });
  }

  private url(id: number): string {
    return `${environment.apiUrl}/api/suivi-resident/${id}`;
  }
}
