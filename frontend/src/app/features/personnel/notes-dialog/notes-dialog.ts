import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PersonnelService, errorMessage } from '../../../core/services/personnel.service';
import { NOTE_CATEGORY_LABEL, Note, NoteCategory } from '../../../shared/models/personnel.model';

@Component({
  selector: 'app-notes-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Notes de service</h2>
    <mat-dialog-content>
      <p>Les actions à suivre sont à inscrire dans la relève.</p>
      <form (submit)="$event.preventDefault(); save()">
        <label>
          Catégorie
          <select #categoryField (change)="category.set($any(categoryField.value))">
            @for (key of categories; track key) {
              <option [value]="key">{{ labels[key] }}</option>
            }
          </select>
        </label>
        <mat-form-field appearance="outline">
          <mat-label>Note</mat-label>
          <textarea matInput rows="3" maxlength="1000" [value]="content()" (input)="content.set($any($event.target).value)"></textarea>
        </mat-form-field>
        <button mat-flat-button [disabled]="busy() || !content().trim()">Enregistrer la note</button>
      </form>
      @if (error(); as message) { <p role="alert">{{ message }}</p> }
      @if (busy()) { <p role="status">Chargement des notes…</p> }
      @for (note of notes(); track note.id) {
        <article>
          <h3>{{ labels[note.category] }}</h3>
          <p>{{ note.authorName }} · {{ note.createdAt | date:'dd/MM à HH:mm' }}</p>
          <p class="note">{{ note.content }}</p>
        </article>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Fermer</button></mat-dialog-actions>
  `,
  styles: `
    form { display: grid; justify-items: start; gap: 8px; }
    mat-form-field { width: 100%; }
    article { margin-top: 10px; padding: 10px; border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--app-radius); }
    article h3, article p { margin: 0 0 4px; }
    .note { white-space: pre-wrap; overflow-wrap: anywhere; }
  `,
})
export class NotesDialog {
  private readonly api = inject(PersonnelService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly labels = NOTE_CATEGORY_LABEL;
  protected readonly categories: NoteCategory[] = ['TRACABILITE', 'OBSERVATION', 'INCIDENT'];
  protected readonly category = signal<NoteCategory>('TRACABILITE');
  protected readonly notes = signal<Note[]>([]);
  protected readonly busy = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly content = signal('');

  constructor() {
    this.api.notes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: notes => {
        this.notes.set(notes);
        this.busy.set(false);
      },
      error: error => this.fail(error),
    });
  }

  protected save(): void {
    const content = this.content().trim();
    if (!content || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.addNote(content, this.category()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: note => {
        this.notes.update(notes => [note, ...notes]);
        this.content.set('');
        this.busy.set(false);
      },
      error: error => this.fail(error),
    });
  }

  private fail(error: unknown): void {
    this.busy.set(false);
    this.error.set(errorMessage(error));
  }
}
