import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ResidentService } from '../../../core/services/resident.service';
import { Toolbar } from '../../../shared/components/toolbar/toolbar';
import { ResidentSummary } from '../../../shared/models/resident.model';

@Component({
  selector: 'app-resident-list',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Toolbar,
  ],
  templateUrl: './resident-list.html',
  styleUrl: './resident-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentList implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly router = inject(Router);

  protected readonly residents = signal<ResidentSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly filteredResidents = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) {
      return this.residents();
    }

    return this.residents().filter((resident) =>
      `${resident.firstName} ${resident.lastName} ${resident.roomNumber ?? ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  });

  ngOnInit(): void {
    this.loadResidents();
  }

  protected loadResidents(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.residentService.findAll().subscribe({
      next: (residents) => {
        this.residents.set(residents);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(this.toErrorMessage(error));
      },
    });
  }

  protected onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchQuery.set(event.target.value);
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected viewResident(id: number): void {
    void this.router.navigate(['/medecin/residents', id]);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
    }
    return 'Le chargement des résidents a échoué. Veuillez réessayer.';
  }
}
