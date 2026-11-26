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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResidentService } from '../../../core/services/resident.service';
import { Toolbar } from '../../../shared/components/toolbar/toolbar';

@Component({
  selector: 'app-resident-detail',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    Toolbar,
  ],
  templateUrl: './resident-detail.html',
  styleUrl: './resident-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly residentService = inject(ResidentService);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly residentId = computed(() => {
    const id = Number(this.params().get('id'));
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
  });

  protected readonly resident = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findById(params),
  });

  protected readonly medicalRecord = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findMedicalRecordByResidentId(params),
  });

  protected readonly residentError = computed(() => {
    if (this.residentId() === undefined) {
      return 'Identifiant de résident invalide.';
    }
    const error = this.resident.error();
    return error ? this.toResidentErrorMessage(error) : null;
  });

  protected readonly medicalRecordError = computed(() => {
    const error = this.medicalRecord.error();
    return error ? this.toMedicalRecordErrorMessage(error) : null;
  });

  private toResidentErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      }
      if (error.status === 403) {
        return "Vous n'avez pas l'autorisation de consulter cette fiche.";
      }
      if (error.status === 404) {
        return 'Résident introuvable.';
      }
    }
    return 'Le chargement de la fiche du résident a échoué.';
  }

  private toMedicalRecordErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      }
      if (error.status === 403) {
        return "Vous n'avez pas l'autorisation de consulter ce dossier médical.";
      }
      if (error.status === 404) {
        return 'Aucun dossier médical n’est disponible pour ce résident.';
      }
    }
    return 'Le chargement du dossier médical a échoué.';
  }
}
