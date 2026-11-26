import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { ResidentService } from '../../core/services/resident.service';
import { Toolbar } from '../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-qr-resident-page',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule, Toolbar],
  templateUrl: './qr-resident-page.html',
  styleUrl: './qr-resident-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrResidentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly residentService = inject(ResidentService);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  protected readonly token = computed(() => this.params().get('token') || undefined);
  protected readonly residentInfo = rxResource({
    params: this.token,
    stream: ({ params }) => this.residentService.findResidentByQrToken(params),
  });
  protected readonly errorMessage = computed(() => {
    const error = this.residentInfo.error();
    if (!error) {
      return null;
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'QR code invalide ou désactivé.';
      }
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      }
    }
    return 'Impossible de charger les informations du résident.';
  });
  protected readonly canRetry = computed(() => {
    const error = this.residentInfo.error();
    return !(error instanceof HttpErrorResponse) || error.status !== 404;
  });
}
