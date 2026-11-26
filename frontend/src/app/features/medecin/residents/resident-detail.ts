import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { normalize } from '../../../shared/utils/text';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResidentService } from '../../../core/services/resident.service';
import { ResidentOverview } from '../../../shared/components/resident-overview/resident-overview';
import { Toolbar } from '../../../shared/components/toolbar/toolbar';
import {
  Allergy,
  AllergyRequest,
  DietaryRegime,
  DietaryRegimeRequest,
  MedicalRecord,
  QrCode,
} from '../../../shared/models/resident.model';

import { createQrSvgDataUrl } from '../../../shared/utils/qr-code';

import { ResidentDaily } from '../../../shared/components/resident-daily/resident-daily';

@Component({
  selector: 'app-resident-detail',
  imports: [
    MatAutocompleteModule,
    ResidentOverview,
    ResidentDaily,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
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
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
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

  protected readonly allergyOptions = ['Arachides', 'Fruits de mer', 'Poisson'];
  protected readonly severityOptions = ['Légère', 'Modérée', 'Grave'];
  protected readonly dietOptions = ['Normal', 'Sans sel', 'Diabétique', 'Végétarien'];
  protected readonly textureOptions = ['Normale', 'Hachée', 'Mixée'];

  protected useCustomValue(event: MatAutocompleteSelectedEvent, control: FormControl<string>): void {
    if (event.option.value === null) {
      control.setValue('');
    }
  }

  protected matchingOptions(options: readonly string[], value: string): string[] {
    const query = normalize(value);
    return options.filter(option => normalize(option).includes(query));
  }

  protected readonly medicalRecordMissing = computed(() => {
    const error = this.medicalRecord.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly medicalEditing = signal(false);
  protected readonly medicalSaving = signal(false);
  protected readonly medicalSaveError = signal<string | null>(null);
  private medicalVersion: number | null = null;
  protected readonly medicalForm = this.formBuilder.group({
    history: ['', Validators.maxLength(8000)],
    treatments: ['', Validators.maxLength(8000)],
  });

  protected readonly medicalRecordError = computed(() => {
    const error = this.medicalRecord.error();
    return error ? this.toMedicalRecordErrorMessage(error) : null;
  });

  protected readonly qrCodes = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findQrCodesByResidentId(params),
    defaultValue: [],
  });

  protected readonly qrCodeError = computed(() => {
    const error = this.qrCodes.error();
    return error ? this.toCollectionErrorMessage(error, 'codes QR') : null;
  });

  protected readonly qrCodeSaving = signal(false);
  protected readonly activeQrCode = computed(
    () => (this.qrCodes.hasValue() ? this.qrCodes.value() : []).find((qrCode) => qrCode.active) ?? null,
  );
  protected readonly latestQrCode = computed(() =>
    (this.qrCodes.hasValue() ? this.qrCodes.value() : []).reduce<QrCode | null>(
      (latest, qrCode) =>
        latest === null || qrCode.createdAt > latest.createdAt ? qrCode : latest,
      null,
    ),
  );
  protected readonly visibleQrCodeId = signal<number | null>(null);
  protected readonly qrImageDataUrl = computed(() => {
    const qrCode = this.activeQrCode();
    if (!qrCode?.token) return null;
    try {
      return createQrSvgDataUrl(qrCode.token);
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
  });

  protected readonly allergies = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findAllergiesByResidentId(params),
    defaultValue: [],
  });

  protected readonly dietaryRegimes = rxResource({
    params: this.residentId,
    stream: ({ params }) => this.residentService.findDietaryRegimesByResidentId(params),
    defaultValue: [],
  });

  protected readonly allergiesError = computed(() => {
    const error = this.allergies.error();
    return error ? this.toCollectionErrorMessage(error, 'allergies') : null;
  });

  protected readonly dietaryRegimesError = computed(() => {
    const error = this.dietaryRegimes.error();
    return error ? this.toCollectionErrorMessage(error, 'régimes alimentaires') : null;
  });

  protected readonly allergySaving = signal(false);
  protected readonly dietaryRegimeSaving = signal(false);
  protected readonly showAllergyForm = signal(false);
  protected readonly showDietaryRegimeForm = signal(false);
  private allergyVersion: number | undefined;
  protected readonly editingAllergyId = signal<number | null>(null);
  private dietaryRegimeVersion: number | undefined;
  protected readonly editingDietaryRegimeId = signal<number | null>(null);
  protected readonly allergyForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    severity: ['', [Validators.maxLength(50)]],
  });
  protected readonly dietaryRegimeForm = this.formBuilder.group({
    type: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    texture: ['', [Validators.maxLength(50)]],
    restrictions: [''],
    intolerances: [''],
    instructions: [''],
  });

  constructor() {
    effect(() => {
      this.residentId();
      untracked(() => {
        this.cancelAllergyForm();
        this.cancelDietaryRegimeForm();
        this.medicalEditing.set(false);
        this.medicalSaving.set(false);
        this.medicalSaveError.set(null);
        this.qrCodeSaving.set(false);
        this.allergySaving.set(false);
        this.dietaryRegimeSaving.set(false);
      });
    });
  }

  protected editMedicalRecord(record: MedicalRecord | null): void {
    this.medicalVersion = record?.version ?? null;
    this.medicalForm.reset({ history: record?.history ?? '', treatments: record?.treatments ?? '' });
    this.medicalSaveError.set(null);
    this.medicalEditing.set(true);
  }

  protected cancelMedicalRecord(): void {
    if (this.medicalSaving()) return;
    this.medicalEditing.set(false);
    this.medicalSaveError.set(null);
  }

  protected saveMedicalRecord(): void {
    const id = this.residentId();
    if (id === undefined || this.medicalSaving() || this.medicalForm.invalid) return;
    const { history, treatments } = this.medicalForm.getRawValue();
    if (!history.trim() && !treatments.trim()) {
      this.medicalSaveError.set('Renseignez au moins un des deux champs.');
      return;
    }
    this.medicalSaving.set(true);
    this.medicalSaveError.set(null);
    this.residentService.saveMedicalRecord(id, { history, treatments, version: this.medicalVersion })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          if (id !== this.residentId()) return;
          this.medicalSaving.set(false);
          this.cancelMedicalRecord();
          this.medicalRecord.reload();
          this.showSuccess('Dossier enregistré.');
        },
        error: error => {
          if (id !== this.residentId()) return;
          this.medicalSaving.set(false);
          this.medicalSaveError.set(error instanceof HttpErrorResponse && error.status === 409
            ? 'Le dossier a changé. Copiez vos notes si nécessaire, annulez cette édition et relisez la dernière version.'
            : 'Impossible d’enregistrer le dossier. Vérifiez les champs et réessayez.');
          if (error instanceof HttpErrorResponse && error.status === 409) this.medicalRecord.reload();
        },
      });
  }

  protected generateQrCode(): void {
    if (this.qrCodeSaving()) {
      return;
    }

    const currentQrCode = this.activeQrCode();
    if (
      currentQrCode &&
      !window.confirm('Le code QR actif sera désactivé et remplacé. Continuer ?')
    ) {
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined) {
      return;
    }

    this.visibleQrCodeId.set(null);
    this.qrCodeSaving.set(true);
    this.residentService.generateQrCode(residentId, currentQrCode?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.showSuccess(currentQrCode ? 'QR Code renouvelé.' : 'QR Code généré.');
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.showMutationError(error, 'La génération du code QR');
      },
    });
  }

  protected deactivateQrCode(): void {
    const currentQrCode = this.activeQrCode();
    if (!currentQrCode || this.qrCodeSaving()) {
      return;
    }
    if (!window.confirm('Désactiver ce code QR ?')) {
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined) {
      return;
    }

    this.visibleQrCodeId.set(null);
    this.qrCodeSaving.set(true);
    this.residentService.deactivateQrCode(residentId, currentQrCode.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.qrCodes.reload();
        this.showSuccess('QR Code désactivé.');
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.qrCodeSaving.set(false);
        this.showMutationError(error, 'La désactivation du code QR');
      },
    });
  }

  protected downloadQrCode(): void {
    const currentQrCode = this.activeQrCode();
    const imageDataUrl = this.qrImageDataUrl();
    if (!currentQrCode || !imageDataUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `qr-code-resident-${currentQrCode.residentId}.svg`;
    link.click();
  }

  protected printQrCode(): void {
    if (this.visibleQrCodeId() === this.activeQrCode()?.id && this.qrImageDataUrl()) {
      window.print();
    }
  }

  protected startNewAllergy(): void {
    this.editingAllergyId.set(null);
    this.allergyVersion = undefined;
    this.allergyForm.reset({ name: '', severity: '' });
    this.showAllergyForm.set(true);
  }

  protected startEditAllergy(allergy: Allergy): void {
    this.editingAllergyId.set(allergy.id);
    this.allergyVersion = allergy.version;
    this.allergyForm.reset({
      name: allergy.name,
      severity: allergy.severity ?? '',
    });
    this.showAllergyForm.set(true);
  }

  protected cancelAllergyForm(): void {
    this.showAllergyForm.set(false);
    this.editingAllergyId.set(null);
    this.allergyVersion = undefined;
    this.allergyForm.reset({ name: '', severity: '' });
  }

  protected saveAllergy(): void {
    if (this.allergySaving()) {
      return;
    }
    if (this.allergyForm.invalid) {
      this.allergyForm.markAllAsTouched();
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined) {
      return;
    }

    const values = this.allergyForm.getRawValue();
    const request: AllergyRequest = {
      version: this.allergyVersion,
      name: values.name.trim(),
      severity: values.severity.trim() || null,
    };
    const allergyId = this.editingAllergyId();
    this.allergySaving.set(true);

    const saveRequest =
      allergyId === null
        ? this.residentService.createAllergy(residentId, request)
        : this.residentService.updateAllergy(residentId, allergyId, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.allergySaving.set(false);
        this.cancelAllergyForm();
        this.allergies.reload();
        this.showSuccess(allergyId === null ? 'Allergie ajoutée.' : 'Allergie modifiée.');
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.allergySaving.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.allergies.reload();
        }
        this.showMutationError(error, "L'enregistrement de l'allergie");
      },
    });
  }

  protected deleteAllergy(allergy: Allergy): void {
    if (!window.confirm(`Supprimer l'allergie « ${allergy.name} » ?`)) {
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined || this.allergySaving()) {
      return;
    }

    this.allergySaving.set(true);
    this.residentService.deleteAllergy(residentId, allergy.id, allergy.version).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.allergySaving.set(false);
        if (this.editingAllergyId() === allergy.id) {
          this.cancelAllergyForm();
        }
        this.allergies.reload();
        this.showSuccess('Allergie supprimée.');
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.allergySaving.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.allergies.reload();
        }
        this.showMutationError(error, "La suppression de l'allergie");
      },
    });
  }

  protected startNewDietaryRegime(): void {
    this.editingDietaryRegimeId.set(null);
    this.dietaryRegimeVersion = undefined;
    this.dietaryRegimeForm.reset({
      type: '',
      texture: '',
      restrictions: '',
      intolerances: '',
      instructions: '',
    });
    this.showDietaryRegimeForm.set(true);
  }

  protected startEditDietaryRegime(regime: DietaryRegime): void {
    this.editingDietaryRegimeId.set(regime.id);
    this.dietaryRegimeVersion = regime.version;
    this.dietaryRegimeForm.reset({
      type: regime.type,
      texture: regime.texture ?? '',
      restrictions: regime.restrictions ?? '',
      intolerances: regime.intolerances ?? '',
      instructions: regime.instructions ?? '',
    });
    this.showDietaryRegimeForm.set(true);
  }

  protected cancelDietaryRegimeForm(): void {
    this.showDietaryRegimeForm.set(false);
    this.editingDietaryRegimeId.set(null);
    this.dietaryRegimeVersion = undefined;
    this.dietaryRegimeForm.reset({
      type: '',
      texture: '',
      restrictions: '',
      intolerances: '',
      instructions: '',
    });
  }

  protected saveDietaryRegime(): void {
    if (this.dietaryRegimeSaving()) {
      return;
    }
    if (this.dietaryRegimeForm.invalid) {
      this.dietaryRegimeForm.markAllAsTouched();
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined) {
      return;
    }

    const values = this.dietaryRegimeForm.getRawValue();
    const request: DietaryRegimeRequest = {
      version: this.dietaryRegimeVersion,
      type: values.type.trim(),
      texture: values.texture.trim() || null,
      restrictions: values.restrictions.trim() || null,
      intolerances: values.intolerances.trim() || null,
      instructions: values.instructions.trim() || null,
    };
    const regimeId = this.editingDietaryRegimeId();
    this.dietaryRegimeSaving.set(true);

    const saveRequest =
      regimeId === null
        ? this.residentService.createDietaryRegime(residentId, request)
        : this.residentService.updateDietaryRegime(residentId, regimeId, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.dietaryRegimeSaving.set(false);
        this.cancelDietaryRegimeForm();
        this.dietaryRegimes.reload();
        this.showSuccess(
          regimeId === null ? 'Régime alimentaire ajouté.' : 'Régime alimentaire modifié.',
        );
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.dietaryRegimeSaving.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.dietaryRegimes.reload();
        }
        this.showMutationError(error, "L'enregistrement du régime alimentaire");
      },
    });
  }

  protected deleteDietaryRegime(regime: DietaryRegime): void {
    if (!window.confirm(`Supprimer le régime alimentaire « ${regime.type} » ?`)) {
      return;
    }

    const residentId = this.residentId();
    if (residentId === undefined || this.dietaryRegimeSaving()) {
      return;
    }

    this.dietaryRegimeSaving.set(true);
    this.residentService.deleteDietaryRegime(residentId, regime.id, regime.version).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.residentId() !== residentId) return;
        this.dietaryRegimeSaving.set(false);
        if (this.editingDietaryRegimeId() === regime.id) {
          this.cancelDietaryRegimeForm();
        }
        this.dietaryRegimes.reload();
        this.showSuccess('Régime alimentaire supprimé.');
      },
      error: (error: unknown) => {
        if (this.residentId() !== residentId) return;
        this.dietaryRegimeSaving.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.dietaryRegimes.reload();
        }
        this.showMutationError(error, 'La suppression du régime alimentaire');
      },
    });
  }

  private toCollectionErrorMessage(error: unknown, collection: string): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
    }
    return `Le chargement des ${collection} a échoué.`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }

  private showMutationError(error: unknown, action: string): void {
    let message = `${action} a échoué.`;
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        message = 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
      } else if (error.status === 400) {
        message = 'Veuillez vérifier les informations saisies.';
      } else if (error.status === 403) {
        message = "Vous n'avez pas l'autorisation d'effectuer cette opération.";
      } else if (error.status === 409) {
        message = error.error?.message ?? 'Les données ont changé. Réessayez.';
      } else if (error.status === 404) {
        message = 'Le résident ou l’enregistrement demandé est introuvable.';
      }
    }
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
  }

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
