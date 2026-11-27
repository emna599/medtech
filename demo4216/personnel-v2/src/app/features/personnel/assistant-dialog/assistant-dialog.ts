import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { errorMessage, PersonnelService } from '../../../core/services/personnel.service';
import { AssistantAction, AssistantResidentRef } from '../../../shared/models/personnel.model';

export interface AssistantResult {
  /** Une action a été confirmée : l'accueil doit se recharger. */
  changed: boolean;
  /** Résident dont on veut ouvrir la fiche. */
  residentId?: number;
}

type ActionState = 'pending' | 'busy' | 'done' | 'error';

interface ChatMessage {
  id: number;
  from: 'me' | 'bot';
  text: string;
  residents: AssistantResidentRef[];
  action: AssistantAction | null;
  actionState: ActionState;
  actionError: string | null;
}

/** Minimal : l'API de reconnaissance vocale n'est pas dans les types de TypeScript. */
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => Recognition;

const SUGGESTIONS = [
  "Qui n'a pas encore mangé ?",
  'Quels médicaments restent à donner ?',
  'Qui a refusé ?',
  'Résumé du service',
  'Quelles sont les allergies ?',
];

/**
 * « MedTech Assist » : questions en français (écrites ou dictées) sur le service en cours.
 * L'assistant ne modifie rien : quand il propose une action, le soignant la confirme d'un bouton.
 */
@Component({
  selector: 'app-assistant-dialog',
  imports: [FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './assistant-dialog.html',
  styleUrl: './assistant-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantDialog {
  private readonly api = inject(PersonnelService);
  private readonly ref = inject<MatDialogRef<AssistantDialog, AssistantResult>>(MatDialogRef);

  protected readonly suggestions = SUGGESTIONS;
  protected readonly messages = signal<ChatMessage[]>([
    {
      id: 0,
      from: 'bot',
      text: 'Bonjour ! Posez-moi une question sur le service, par exemple « qui n\'a pas encore mangé ? ».',
      residents: [],
      action: null,
      actionState: 'pending',
      actionError: null,
    },
  ]);
  protected readonly draft = signal('');
  protected readonly thinking = signal(false);
  protected readonly listening = signal(false);
  protected readonly canDictate: boolean;
  protected readonly canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  /** Lire les réponses à voix haute. */
  protected readonly speakOn = signal(false);
  /** Mains libres : on parle, l'assistant répond à voix haute, puis écoute de nouveau. */
  protected readonly handsFree = signal(false);
  protected readonly lastId = computed(() => this.messages().length);

  private changed = false;
  private nextId = 1;
  private recognition: Recognition | null = null;
  private heardSpeech = false;
  private destroyed = false;

  constructor() {
    const ctor = this.recognitionCtor();
    this.canDictate = ctor !== null;
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.recognition?.stop();
      if (this.canSpeak) {
        window.speechSynthesis.cancel();
      }
    });
  }

  protected send(text = this.draft()): void {
    const message = text.trim();
    if (!message || this.thinking()) {
      return;
    }
    this.heardSpeech = false;
    this.recognition?.stop();
    if (this.canSpeak) {
      window.speechSynthesis.cancel();
    }
    this.draft.set('');
    this.push({ from: 'me', text: message });
    this.thinking.set(true);
    this.api.ask(message).subscribe({
      next: (reply) => {
        this.thinking.set(false);
        this.push({
          from: 'bot',
          text: reply.answer,
          residents: reply.residents,
          action: reply.action,
        });
        this.afterAnswer(reply.answer);
      },
      error: (err: unknown) => {
        this.thinking.set(false);
        const text = errorMessage(err);
        this.push({ from: 'bot', text });
        this.afterAnswer(text);
      },
    });
  }

  protected confirm(message: ChatMessage): void {
    const action = message.action;
    if (!action || message.actionState === 'busy' || message.actionState === 'done') {
      return;
    }
    this.patch(message.id, { actionState: 'busy', actionError: null });
    this.api.completeById(action.kind, action.itemId, { status: 'FAIT' }).subscribe({
      next: () => {
        this.changed = true;
        this.patch(message.id, { actionState: 'done' });
      },
      error: (err: unknown) => this.patch(message.id, { actionState: 'error', actionError: errorMessage(err) }),
    });
  }

  protected cancel(message: ChatMessage): void {
    this.patch(message.id, { action: null });
  }

  protected openResident(residentId: number): void {
    this.ref.close({ changed: this.changed, residentId });
  }

  protected close(): void {
    this.ref.close({ changed: this.changed });
  }

  protected toggleSpeak(): void {
    const on = !this.speakOn();
    this.speakOn.set(on);
    if (!on) {
      this.handsFree.set(false);
      if (this.canSpeak) {
        window.speechSynthesis.cancel();
      }
    }
  }

  protected toggleHandsFree(): void {
    const on = !this.handsFree();
    this.handsFree.set(on);
    if (on) {
      this.speakOn.set(this.canSpeak);
      if (!this.listening()) {
        this.toggleDictation();
      }
    } else {
      this.recognition?.stop();
      if (this.canSpeak) {
        window.speechSynthesis.cancel();
      }
    }
  }

  protected toggleDictation(): void {
    if (this.listening()) {
      this.recognition?.stop();
      return;
    }
    const ctor = this.recognitionCtor();
    if (!ctor) {
      return;
    }
    const recognition = new ctor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.heardSpeech = transcript.trim().length > 0;
      this.draft.set(transcript);
    };
    recognition.onend = () => {
      this.listening.set(false);
      // Dictée terminée : la question part toute seule, comme avec un assistant vocal.
      if (this.heardSpeech && !this.destroyed) {
        this.send();
      } else if (this.handsFree() && !this.destroyed && !this.thinking()) {
        // Silence : en mains libres on réécoute.
        queueMicrotask(() => this.handsFree() && !this.listening() && this.toggleDictation());
      }
    };
    recognition.onerror = () => {
      this.listening.set(false);
      this.heardSpeech = false;
    };
    this.recognition = recognition;
    this.listening.set(true);
    try {
      recognition.start();
    } catch {
      this.listening.set(false);
    }
  }

  /** Lit la réponse à voix haute si demandé, puis, en mains libres, réécoute. */
  private afterAnswer(text: string): void {
    const listenAgain = () => {
      if (this.handsFree() && !this.destroyed && !this.listening()) {
        this.toggleDictation();
      }
    };
    if (this.speakOn() && this.canSpeak) {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[⚠→]/g, ' ').replace(/\s+/g, ' '));
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onend = listenAgain;
      utterance.onerror = listenAgain;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      listenAgain();
    }
  }

  private recognitionCtor(): RecognitionCtor | null {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }

  private push(partial: Partial<ChatMessage> & Pick<ChatMessage, 'from' | 'text'>): void {
    const message: ChatMessage = {
      id: this.nextId++,
      residents: [],
      action: null,
      actionState: 'pending',
      actionError: null,
      ...partial,
    };
    this.messages.update((list) => [...list, message]);
    queueMicrotask(() => document.getElementById('assistant-end')?.scrollIntoView?.({ block: 'end' }));
  }

  private patch(id: number, change: Partial<ChatMessage>): void {
    this.messages.update((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));
  }
}
