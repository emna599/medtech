import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { JOB_LABEL, Note, NOTE_CATEGORY_LABEL, NoteCategory } from '../../../shared/models/personnel.model';

export interface NotesDialogData {
  /** Si renseigné, les notes sont celles de ce résident et la nouvelle note lui est rattachée. */
  residentId?: number;
  residentName?: string;
}

interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => RecognitionLike;

const MAX_LENGTH = 1000;

/** Notes de traçabilité : saisies au clavier ou dictées, signées et horodatées. */
@Component({
  selector: 'app-notes-dialog',
  imports: [DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './notes-dialog.html',
  styleUrl: './notes-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<NotesDialog>>(MatDialogRef);
  protected readonly data = inject<NotesDialogData | null>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  protected readonly maxLength = MAX_LENGTH;
  protected readonly categories = Object.keys(NOTE_CATEGORY_LABEL) as NoteCategory[];
  protected readonly categoryLabel = NOTE_CATEGORY_LABEL;
  protected readonly jobLabel = JOB_LABEL;

  protected readonly notes = signal<Note[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly category = signal<NoteCategory>('TRACABILITE');
  protected readonly saving = signal(false);
  protected readonly listening = signal(false);
  protected readonly canDictate: boolean;

  private recognition: RecognitionLike | null = null;
  private destroyed = false;

  constructor() {
    this.canDictate = this.recognitionCtor() !== null;
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.recognition?.stop();
    });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.notes(this.data.residentId).subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    const content = this.draft().trim();
    if (!content || this.saving()) {
      return;
    }
    this.recognition?.stop();
    this.saving.set(true);
    this.error.set(null);
    this.api.addNote(content, this.category(), this.data.residentId).subscribe({
      next: (note) => {
        this.notes.update((list) => [note, ...list]);
        this.draft.set('');
        this.saving.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  /** Dictée continue : le texte parlé s'ajoute à ce qui est déjà écrit, et le soignant relit avant d'enregistrer. */
  protected toggleDictation(): void {
    if (this.listening()) {
      this.recognition?.stop();
      return;
    }
    const ctor = this.recognitionCtor();
    if (!ctor) {
      return;
    }
    const base = this.draft().trim();
    const recognition = new ctor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      let spoken = '';
      for (let i = 0; i < event.results.length; i++) {
        spoken += event.results[i][0].transcript;
      }
      this.draft.set(`${base} ${spoken}`.trim().slice(0, MAX_LENGTH));
    };
    recognition.onend = () => {
      if (!this.destroyed) {
        this.listening.set(false);
      }
    };
    recognition.onerror = () => {
      if (!this.destroyed) {
        this.listening.set(false);
      }
    };
    this.recognition = recognition;
    this.listening.set(true);
    try {
      recognition.start();
    } catch {
      this.listening.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }

  private recognitionCtor(): RecognitionCtor | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }
}
