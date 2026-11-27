import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { JOB_LABEL, Job, Team, TeamMember } from '../../../shared/models/personnel.model';

/** Équipe en service : combien d'infirmiers et d'aides-soignants sont là, leurs noms et leur part de résidents. */
@Component({
  selector: 'app-team-dialog',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './team-dialog.html',
  styleUrl: './team-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<TeamDialog, Team>>(MatDialogRef);

  protected readonly team = signal<Team | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly jobLabel = JOB_LABEL;

  protected readonly groups = computed(() => {
    const team = this.team();
    if (!team) {
      return [];
    }
    return (['INFIRMIER', 'AIDE_SOIGNANT'] as Job[])
      .map((job) => ({ job, members: team.members.filter((member) => member.job === job) }))
      .filter((group) => group.members.length > 0);
  });

  constructor() {
    this.api.team().subscribe({
      next: (team) => this.update(team),
      error: (err: unknown) => this.fail(err),
    });
  }

  protected toggleService(): void {
    const team = this.team();
    if (!team || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    (team.present ? this.api.checkOut() : this.api.checkIn()).subscribe({
      next: (updated) => this.update(updated),
      error: (err: unknown) => this.fail(err),
    });
  }

  protected share(member: TeamMember): string {
    if (member.residents === 0) {
      return 'Aucun résident';
    }
    return `${member.residents} résident(s)${member.rooms ? ' · ch. ' + member.rooms : ''}`;
  }

  protected close(): void {
    this.ref.close(this.team() ?? undefined);
  }

  private update(team: Team): void {
    this.team.set(team);
    this.loading.set(false);
    this.busy.set(false);
  }

  private fail(err: unknown): void {
    this.error.set(errorMessage(err));
    this.loading.set(false);
    this.busy.set(false);
  }
}
