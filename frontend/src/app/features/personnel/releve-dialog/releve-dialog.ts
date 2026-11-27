import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { Doubt, fullName, ServiceItem, slotLabel } from '../../../shared/models/personnel.model';

interface SlotLine {
  slot: string;
  done: number;
  total: number;
}

/** Une personne à signaler à l'équipe suivante, avec la raison en une phrase. */
interface Alert {
  residentName: string;
  room: string | null;
  text: string;
}

/**
 * Résumé de relève : ce qu'il faut transmettre à l'équipe suivante, calculé à partir du service du jour.
 * Lecture seule : rien n'est enregistré ici.
 */
@Component({
  selector: 'app-releve-dialog',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './releve-dialog.html',
  styleUrl: './releve-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleveDialog {
  private readonly api = inject(PersonnelService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly ref = inject<MatDialogRef<ReleveDialog>>(MatDialogRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly meals = signal<ServiceItem[]>([]);
  private readonly doses = signal<ServiceItem[]>([]);
  protected readonly doubts = signal<Doubt[]>([]);
  protected readonly now = new Date();
  protected readonly nowText = `${this.now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${this.now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  protected readonly mealLines = computed(() => this.lines(this.meals()));
  protected readonly doseLines = computed(() => this.lines(this.doses()));

  /** À surveiller : refus, repas à peine touchés, prises à risque pas encore données. */
  protected readonly alerts = computed<Alert[]>(() => {
    const out: Alert[] = [];
    const add = (item: ServiceItem, text: string) =>
      out.push({ residentName: fullName(item.resident), room: item.resident.room, text });
    for (const item of this.meals()) {
      if (item.status === 'REFUSE') {
        add(item, `a refusé le repas (${slotLabel(item.slot)})`);
      } else if (item.status === 'FAIT' && (item.quantityEaten === 'RIEN' || item.quantityEaten === 'QUART')) {
        add(item, `a très peu mangé (${slotLabel(item.slot)})`);
      }
    }
    for (const item of this.doses()) {
      if (item.status === 'REFUSE') {
        add(item, `a refusé : ${item.label} (${slotLabel(item.slot)})`);
      } else if (item.highRisk && (item.status === 'A_FAIRE' || item.status === 'PLUS_TARD')) {
        add(item, `traitement à risque pas encore donné : ${item.label} (${slotLabel(item.slot)})`);
      }
    }
    return out;
  });

  /** Ce qui reste à faire, à transmettre tel quel. */
  protected readonly todo = computed(() => {
    const pending = (items: ServiceItem[]) =>
      items.filter((i) => i.status === 'A_FAIRE' || i.status === 'PLUS_TARD');
    return { meals: pending(this.meals()).length, doses: pending(this.doses()).length };
  });

  constructor() {
    forkJoin({
      meals: this.api.listService('REPAS'),
      doses: this.api.listService('MEDICAMENT'),
      doubts: this.api.openDoubts(),
    }).subscribe({
      next: ({ meals, doses, doubts }) => {
        this.meals.set(meals);
        this.doses.set(doses);
        this.doubts.set(doubts);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected slotText(slot: string): string {
    return slotLabel(slot);
  }

  protected copy(): void {
    const text = this.asText();
    const done = () => this.snackBar.open('Résumé copié', 'OK', { duration: 3000 });
    const failed = () => this.snackBar.open("Copie impossible : sélectionnez le texte à la main", 'OK', { duration: 5000 });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, failed);
    } else {
      failed();
    }
  }

  private lines(items: ServiceItem[]): SlotLine[] {
    const order: string[] = [];
    for (const item of items) {
      if (!order.includes(item.slot)) {
        order.push(item.slot);
      }
    }
    return order.map((slot) => {
      const inSlot = items.filter((i) => i.slot === slot);
      return {
        slot,
        done: inSlot.filter((i) => i.status === 'FAIT' || i.status === 'REFUSE').length,
        total: inSlot.length,
      };
    });
  }

  private asText(): string {
    const out: string[] = [`Relève du ${this.now.toLocaleDateString('fr-FR')} à ${this.now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`];
    out.push('', 'Repas : ' + (this.mealLines().map((l) => `${slotLabel(l.slot)} ${l.done}/${l.total}`).join(', ') || 'aucun'));
    out.push('Médicaments : ' + (this.doseLines().map((l) => `${slotLabel(l.slot)} ${l.done}/${l.total}`).join(', ') || 'aucun'));
    out.push(`Reste à faire : ${this.todo().meals} repas, ${this.todo().doses} prises`);
    if (this.doubts().length > 0) {
      out.push('', "Doutes d'identité à lever :");
      for (const d of this.doubts()) {
        out.push(`- ${d.residentName}`);
      }
    }
    if (this.alerts().length > 0) {
      out.push('', 'À surveiller :');
      for (const a of this.alerts()) {
        out.push(`- ${a.residentName}${a.room ? ' (ch. ' + a.room + ')' : ''} : ${a.text}`);
      }
    } else {
      out.push('', 'Rien de particulier à signaler.');
    }
    return out.join('\n');
  }
}
